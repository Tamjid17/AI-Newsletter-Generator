import { fetchArticles } from "@/lib/news";
import { inngest } from "../client"
import { marked } from "marked";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/server";

export default inngest.createFunction(
    {id: "scheduled-newsletter"}, 
    {event: "newsletter.scheduled"},
    async ({event, step}) => {

      const isUserActive = await step.run("check-user-status", async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
        .from("user_preferences")
        .select("is_active")
        .eq("user_id", event.data.userId)
        .single();

        if(error) {
          return false;
        }

        return data.is_active || false;
      });

      if(!isUserActive) {
        return {};
      }

      // Fetch articles per category
      const categories = event.data.categories;
      const allArticles = await step.run("fetch-news", async () => {
        return fetchArticles(categories);
      });

      // Check if any articles were fetched before calling the LLM
      if (allArticles.length === 0) {
        console.log("No articles found to summarize. Skipping AI generation.");
        return { status: "no_articles_found" };
      }

      // Generate ai summary
      const openrouterApiKey = process.env.OPENROUTER_API_KEY;
      const model = "openai/gpt-oss-20b:free";

      try {
        const summary = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openrouterApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: "system",
                  content: `You are an expert newsletter editor creating a personalized newsletter. 
                Write a concise, engaging summary that:
                - Highlights the most important stories
                - Provides context and insights
                - Uses a friendly, conversational tone
                - Is well-structured with clear sections
                - Keeps the reader informed and engaged
                Format the response as a proper newsletter with a title and organized content.
                Make it email-friendly with clear sections and engaging subject lines.`,
                },
                {
                  role: "user",
                  content: `Create a newsletter summary for these articles from the past week. 
                Categories requested: ${categories.join(", ")}

                Articles:
                ${allArticles
                  .map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (article: any, index: number) =>
                      `${index + 1}. ${article.title}\n   ${
                        article.description
                      }\n   Source: ${article.url}\n`
                  )
                  .join("\n")}`,
                },
              ],
            }),
          }
        );

        if (!summary.ok) {
          const errorData = await summary.json();
          console.error("OpenRouter API Error:", summary.status, errorData);
          throw new Error("Failed to generate summary from OpenRouter.");
        }

        const data = await summary.json();

        // Defensive check to ensure the properties exist
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error(
            "OpenRouter API response is missing expected data:",
            data
          );
          return { status: "empty_response_data" };
        }

        const finalSummary = data.choices[0].message.content;

        const htmlSummary = await marked(finalSummary);

        await step.run("send-email", async () => {
          await sendEmail(event.data.email, event.data.categories.join(", "), allArticles.length, htmlSummary);
        })

        await step.run("schedule-next", async () => {
          const now = new Date();
          let nextScheduleTime: Date;

          switch (event.data.frequency) {
            case "daily":
              nextScheduleTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              break;
            case "weekly":
              nextScheduleTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
            case "biweekly":
              nextScheduleTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
              break;
            default:
              nextScheduleTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          }

          nextScheduleTime.setHours(9, 0, 0, 0);

          await inngest.send({
            name: "newsletter.scheduled",
            data: {
              categories,
              email: event.data.email,
              frequency: event.data.frequency,
            },
            ts: nextScheduleTime.getTime(),
          })
        })

        console.log("Generated summary:", finalSummary);
        return {
          summary: finalSummary,
          articleCount: allArticles.length,
          status: "success",
        };
      } catch (error) {
      console.error("Failed to make API request to OpenRouter:", error);
      throw error;
    }
  }
)
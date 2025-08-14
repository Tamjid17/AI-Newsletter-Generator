import { fetchArticles } from "@/lib/news";
import { inngest } from "../client"

export default inngest.createFunction(
    {id: "scheduled-newsletter"}, 
    {event: "newsletter.scheduled"},
    async ({event, step, runId}) => {

        // Fetch articles per category
        const categories = ["technology", "health", "finance"];
        const allArticles = await step.run("fetch-news", async () => {

            return fetchArticles(categories);
        })

        // Generate ai summary
        const summary = await step.ai.infer("summarize-news", {
          model: step.ai.models.openai({ model: "o3-mini" }),
          body: {
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
                    (article: any, index: number) =>
                        `${index + 1}. ${article.title}\n   ${
                        article.description
                        }\n   Source: ${article.url}\n`
                    )
                    .join("\n")}`,
            }

            ],
            },
        });

        console.log("Generated summary:", summary.choices[0].message.content);
    }
)
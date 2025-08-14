import { fetchArticles } from "@/lib/news";
import { inngest } from "../client"

export default inngest.createFunction(
    {id: "scheduled-newsletter"}, 
    {event: "newsletter.scheduled"},
    async ({event, step, runId}) => {

        // Fetch articles per category
        const allArticles = await step.run("fetch-news", async () => {
            const categories = ["technology", "health", "finance"];

            return fetchArticles(categories);
        })
    }
)
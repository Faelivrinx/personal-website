import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE } from "../../consts";

export async function GET(context) {
  const posts = await getCollection("blogpl");
  return rss({
    title: SITE_TITLE,
    description: "Osobista strona programisty — artykuły po polsku",
    site: context.site,
    customData: "<language>pl</language>",
    items: posts.map((post) => ({
      ...post.data,
      link: `/pl/blog/${post.slug}/`,
    })),
  });
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, getPost } from "@/data/blog";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

const SITE_URL = process.env.APP_URL || "https://planturnos.com";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Artículo no encontrado · PlanTurnos" };
  return {
    title: `${post.title} · PlanTurnos`,
    description: post.excerpt,
    openGraph: { type: "article", title: post.title, description: post.excerpt },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    description: post.excerpt,
    author: { "@type": "Organization", name: "PlanTurnos" },
    publisher: { "@type": "Organization", name: "PlanTurnos" },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingHeader />

      <article className="mx-auto max-w-3xl px-5 py-14">
        <Link href="/blog" className="text-sm font-medium text-cyan-700 hover:underline">← Blog</Link>
        <p className="mt-4 text-xs font-medium uppercase tracking-widest text-[#8a6d3b]">{post.dateLabel}</p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{post.title}</h1>

        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/img/${post.cover}.webp`} alt={post.title} className="mt-6 h-64 w-full rounded-2xl object-cover object-top shadow-sm sm:h-80" />
        )}

        <div
          className="mt-8 space-y-5 text-lg leading-relaxed text-slate-700 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2"
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />

        <div className="mt-12 rounded-2xl bg-cyan-700 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">¿Lo probamos con tu equipo?</h2>
          <p className="mt-2 text-cyan-100">Te montamos una prueba a tu medida, sin compromiso.</p>
          <Link href="/contacto" className="mt-5 inline-block rounded-lg bg-white px-7 py-3 font-semibold text-cyan-800 hover:bg-cyan-50">
            Pruébalo gratis
          </Link>
        </div>
      </article>

      <MarketingFooter />
    </div>
  );
}

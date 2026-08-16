import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projectsData, getProjectBySlug } from "@/lib/projects";
import { ProjectDetailView } from "@/components/ProjectDetailView";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return projectsData.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: project.name,
    description: project.description,
    openGraph: {
      title: `${project.name} — ${project.tagline}`,
      description: project.description,
      images: [
        {
          url: project.heroImage,
          width: 1200,
          height: 630,
          alt: `${project.name} Hero Screen`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name} — ${project.tagline}`,
      description: project.description,
      images: [project.heroImage],
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} />;
}

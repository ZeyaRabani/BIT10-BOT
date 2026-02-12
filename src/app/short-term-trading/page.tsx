/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

interface Project {
    title: string;
    symbol: string;
    description: string;
    creator: string;
    age: string;
    marketCap: string;
    change: string;
    progressWidth: string;
    image: string;
    link: string | null;
}

export default function LiveProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch("/api/live-projects");

                if (!res.ok) {
                    throw new Error("API failed");
                }

                const data = await res.json();

                if (data.success) {
                    setProjects(data.projects);
                } else {
                    console.error(data.error);
                }
            } catch (err) {
                console.error("Frontend fetch error:", err);
            }
        };

        fetchProjects();
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h1>Live Projects</h1>

            <div style={{ display: "grid", gap: 20 }}>
                {projects.map((project, index) => (
                    <div
                        key={index}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 10,
                            padding: 15,
                        }}
                    >
                        <img
                            src={project.image}
                            width={80}
                            height={80}
                            alt={project.title}
                        />

                        <h2>{project.title}</h2>
                        <p>Symbol: {project.symbol}</p>
                        <p>Creator: {project.creator}</p>
                        <p>Age: {project.age}</p>
                        <p>{project.description}</p>
                        <p>Market Cap: {project.marketCap}</p>
                        <p>Change: {project.change}</p>
                        <p>Progress: {project.progressWidth}</p>

                        {project.link && (
                            <a href={`/project/${project.link?.split("/project/")[1]}`}>
                                View Project
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

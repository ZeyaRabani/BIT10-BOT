"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badges";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ExternalLink, User } from "lucide-react";

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
                if (!res.ok) throw new Error("API failed");
                const data = await res.json();
                if (data.success) {
                    setProjects(data.projects);
                }
            } catch (err) {
                console.error("Frontend fetch error:", err);
            }
        };

        fetchProjects();
    }, []);

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Live Projects</h1>
                    <p className="text-muted-foreground">
                        Real-time overview of active ecosystem projects.
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1">
                    {projects.length} Active
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => {
                    // Safety checks to prevent "Cannot read properties of null"
                    const changeText = project.change || "";
                    const isPositive = !changeText.includes("-");
                    const progressValue = parseInt(project.progressWidth || "0") || 0;

                    return (
                        <Card key={index} className="overflow-hidden flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className="relative h-16 w-16 overflow-hidden rounded-lg border bg-muted">
                                    <img
                                        src={project.image}
                                        alt={project.title}
                                        className="object-cover h-full w-full"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="text-lg truncate">
                                            {project.title}
                                        </CardTitle>
                                        <Badge variant="secondary" className="shrink-0">
                                            {project.symbol}
                                        </Badge>
                                    </div>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <User className="h-3 w-3" />
                                        <span className="truncate">{project.creator}</span> •{" "}
                                        {project.age}
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                    {project.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                                            Market Cap
                                        </p>
                                        <p className="font-mono text-sm font-medium">
                                            {project.marketCap || "N/A"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                                            24h Change
                                        </p>
                                        <p
                                            className={`font-mono text-sm font-medium ${isPositive ? "text-green-600" : "text-red-500"
                                                }`}
                                        >
                                            {project.change || "0%"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span>{project.progressWidth || "0%"}</span>
                                    </div>
                                    <Progress value={progressValue} className="h-2" />
                                </div>
                            </CardContent>

                            <CardFooter className="bg-muted/30 pt-4 border-t">
                                {project.link ? (
                                    <Button asChild className="w-full" variant="default">
                                        <Link
                                            href={`/project/${project.link.split("/project/")[1]}`}
                                        >
                                            View Project
                                            <ExternalLink className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button disabled className="w-full" variant="secondary">
                                        No Link Available
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
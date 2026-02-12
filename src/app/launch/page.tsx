"use client"
import Navbar from '@/components/Navbar'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { TrendingUpIcon, ActivityIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function page() {
    return (
        <div>
            <Navbar />

            <div className="animate-fade-bottom-up flex flex-col items-center justify-center w-full py-8 md:py-16 space-y-4">
                <div className="text-2xl md:text-4xl text-center font-semibold">
                    Choose Your Trading Style
                </div>

                <div className="text-xl text-center text-muted-foreground">
                    Select how you want to trade on BIT10
                </div>

                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                    <a
                        href="https://bit10.app/buy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-75 md:w-80"
                    >
                        <Card className="h-85 border-2 rounded-2xl border-muted hover:border-primary hover:shadow-lg transition-all duration-300 py-10 px-6 flex flex-col items-center justify-between text-center cursor-pointer">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="bg-primary/20 p-4 rounded-xl">
                                    <TrendingUpIcon className="h-8 w-8 text-primary" />
                                </div>

                                <div className="text-2xl font-semibold">
                                    Long Term Trading
                                </div>

                                <div className="text-lg text-muted-foreground">
                                    Trade index funds on crypto and build long term wealth
                                </div>
                            </div>

                            <Button className="px-8 w-full">
                                Start Investing
                            </Button>
                        </Card>
                    </a>

                    <Link href="/short-term-trading" className="w-75 md:w-80">
                        <Card className="h-85 border-2 rounded-2xl border-muted hover:border-primary hover:shadow-lg transition-all duration-300 py-10 px-6 flex flex-col items-center justify-between text-center cursor-pointer">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="bg-primary/20 p-4 rounded-xl">
                                    <ActivityIcon className="h-8 w-8 text-primary" />
                                </div>

                                <div className="text-2xl font-semibold">
                                    Short Term Trading
                                </div>

                                <div className="text-lg text-muted-foreground">
                                    Trade tokens actively and capture short term market movements
                                </div>
                            </div>

                            <Button className="px-8 w-full">
                                Start Trading
                            </Button>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    )
}

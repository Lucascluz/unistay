import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useAuth } from "~/lib/auth";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "StudentStay - Find Honest Student Housing Reviews" },
    { name: "description", content: "Discover real student experiences and reviews about housing in your city or university." },
  ];
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/reviews/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Popular searches for inspiration
  const popularCities = [
    "Amsterdam",
    "London",
    "Berlin",
    "Barcelona",
    "Paris",
    "Lisbon"
  ];

  const popularUniversities = [
    "MIT",
    "Oxford University",
    "Stanford",
    "TU Delft",
    "ETH Zürich"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">StudentStay</span>
            </div>
            <nav className="hidden md:flex gap-6 items-center">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">About</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">How it works</a>
              {isLoggedIn ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Hi, {user?.name}
                  </span>
                  <Button variant="outline" size="sm" onClick={logout}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                  Sign in
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Main Content */}
          <div className="text-center mb-12">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-8 h-8 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Find your perfect
              <br />
              <span className="text-blue-600 dark:text-blue-500">student home</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Read honest reviews from real students about housing in your city or university.
              Make informed decisions for your student life.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="Enter city or university name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-14 text-lg px-6 border-gray-300 dark:border-gray-700"
                />
                <Button 
                  type="submit" 
                  size="lg"
                  className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Search Reviews
                </Button>
              </div>
            </form>

          </div>

          {/* Popular Searches */}
          <Card className="p-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Popular Cities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularCities.map((city) => (
                    <Badge
                      key={city}
                      variant="secondary"
                      className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors px-4 py-2 text-sm"
                      onClick={() => navigate(`/reviews/${encodeURIComponent(city)}`)}
                    >
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Popular Universities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularUniversities.map((university) => (
                    <Badge
                      key={university}
                      variant="secondary"
                      className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors px-4 py-2 text-sm"
                      onClick={() => navigate(`/reviews/${encodeURIComponent(university)}`)}
                    >
                      {university}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Trusted by students from universities worldwide
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

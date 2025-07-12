import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Users, Award, Search } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">StackIt</h1>
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => window.location.href = '/api/login'}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Every developer has a
            <span className="text-orange-500"> tab open to StackIt</span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            Get answers to your coding questions, share knowledge with your peers, 
            and build your developer career with StackIt.
          </p>
          <div className="mt-10">
            <Button 
              size="lg"
              className="bg-orange-500 text-white hover:bg-orange-600 mr-4"
              onClick={() => window.location.href = '/api/login'}
            >
              Join the Community
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900">Why choose StackIt?</h3>
          <p className="mt-4 text-lg text-gray-600">
            The best place for developers to learn, share, and build careers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ask Questions</h4>
              <p className="text-gray-600">Get help from experienced developers worldwide</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Share Knowledge</h4>
              <p className="text-gray-600">Help others and build your reputation in the community</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Build Reputation</h4>
              <p className="text-gray-600">Earn points and badges for your contributions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Search className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Find Solutions</h4>
              <p className="text-gray-600">Search through millions of questions and answers</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white">Ready to get started?</h3>
            <p className="mt-4 text-xl text-orange-100">
              Join thousands of developers who are already using StackIt.
            </p>
            <Button 
              size="lg"
              variant="secondary"
              className="mt-8 bg-white text-orange-500 hover:bg-gray-100"
              onClick={() => window.location.href = '/api/login'}
            >
              Sign Up Now
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h4 className="text-2xl font-bold mb-4">StackIt</h4>
            <p className="text-gray-400">
              The developer community that never stops learning.
            </p>
            <div className="mt-8 text-sm text-gray-500">
              © 2025 StackIt. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

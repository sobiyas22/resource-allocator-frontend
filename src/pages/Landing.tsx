import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Smartphone, Laptop, Calendar, Sprout } from 'lucide-react'

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 text-gray-900 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Smart Resource Allocation
          </h1>
          <p 
            className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Book meeting rooms, phones, laptops, and turf quickly and intuitively.
          </p>
          
          <Link to="/login">
            <Button 
              size="lg" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Login to Get Started
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="bg-white border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 border border-gray-200">
                <Calendar className="w-8 h-8 text-gray-700" />
              </div>
              <CardTitle className="text-xl text-gray-900" style={{ fontFamily: "'Lora', serif" }}>
                Meeting Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Reserve conference spaces with real-time availability
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 border border-gray-200">
                <Smartphone className="w-8 h-8 text-gray-700" />
              </div>
              <CardTitle className="text-xl text-gray-900" style={{ fontFamily: "'Lora', serif" }}>
                Phones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Check out mobile devices instantly
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 border border-gray-200">
                <Laptop className="w-8 h-8 text-gray-700" />
              </div>
              <CardTitle className="text-xl text-gray-900" style={{ fontFamily: "'Lora', serif" }}>
                Laptops
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Borrow workstations for your projects
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 border border-gray-200">
                <Sprout className="w-8 h-8 text-gray-700" />
              </div>
              <CardTitle className="text-xl text-gray-900" style={{ fontFamily: "'Lora', serif" }}>
                Turf
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Book your outdoor space for activities
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Section */}
        <div className="mt-20 max-w-3xl mx-auto text-center">
          <div className="bg-gray-50 rounded-3xl p-8 shadow-lg border border-gray-200">
            <h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Streamline Your Workspace
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Our intuitive platform makes resource management effortless. 
              Track availability, make reservations, and optimize your workspace 
              allocation—all in one place.
            </p>
          </div>
        </div>
      </main>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:wght@400;600&display=swap" 
        rel="stylesheet" 
      />
    </div>
  )
}

export default Landing
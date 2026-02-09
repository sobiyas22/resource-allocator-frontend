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

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h1
            className="text-5xl md:text-7xl font-bold mb-6 text-neutral-900 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Smart Resource Allocation
          </h1>
          <p
            className="text-xl md:text-2xl text-neutral-500 mb-10 leading-relaxed"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Book meeting rooms, phones, laptops, and turf quickly and intuitively.
          </p>

          <Link to="/login">
            <Button
              size="lg"
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Login to Get Started
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            { icon: Calendar, title: 'Meeting Rooms', desc: 'Reserve conference spaces with real-time availability' },
            { icon: Smartphone, title: 'Phones', desc: 'Check out mobile devices instantly' },
            { icon: Laptop, title: 'Laptops', desc: 'Borrow workstations for your projects' },
            { icon: Sprout, title: 'Turf', desc: 'Book your outdoor space for activities' },
          ].map((item, i) => (
            <Card key={i} className="bg-white border-neutral-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4 border border-neutral-200">
                  <item.icon className="w-8 h-8 text-neutral-700" />
                </div>
                <CardTitle className="text-xl text-neutral-900" style={{ fontFamily: "'Lora', serif" }}>
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-neutral-500">
                  {item.desc}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="mt-20 max-w-3xl mx-auto text-center">
          <div className="bg-neutral-50 rounded-3xl p-8 shadow-sm border border-neutral-200">
            <h2
              className="text-3xl font-bold text-neutral-900 mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Streamline Your Workspace
            </h2>
            <p className="text-neutral-500 text-lg leading-relaxed">
              Our intuitive platform makes resource management effortless.
              Track availability, make reservations, and optimize your workspace
              allocation—all in one place.
            </p>
          </div>
        </div>
      </main>

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
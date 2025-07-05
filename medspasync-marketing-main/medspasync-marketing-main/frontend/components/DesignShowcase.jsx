import React from 'react';
import ScrollAnimation, { 
  StaggeredAnimation, 
  Card3D, 
  GlassCard, 
  MorphingShape, 
  FloatingElement,
  ParallaxElement 
} from './ScrollAnimation';
import Button from './Button';

const DesignShowcase = () => {
  const designTrends = [
    {
      title: "Modern Minimalism",
      description: "Clean and simple designs that prioritize functionality",
      icon: "✨",
      color: "from-emerald-400 to-emerald-600",
      darkColor: "from-emerald-500 to-emerald-700"
    },
    {
      title: "Dark Mode",
      description: "Visually appealing option that reduces eye strain",
      icon: "🌙",
      color: "from-indigo-400 to-indigo-600",
      darkColor: "from-indigo-500 to-indigo-700"
    },
    {
      title: "Bold Typography",
      description: "Large, expressive fonts to capture attention",
      icon: "📝",
      color: "from-purple-400 to-purple-600",
      darkColor: "from-purple-500 to-purple-700"
    },
    {
      title: "Glassmorphism",
      description: "Frosted-glass effect with backdrop blur",
      icon: "🔮",
      color: "from-pink-400 to-pink-600",
      darkColor: "from-pink-500 to-pink-700"
    },
    {
      title: "3D Elements",
      description: "Realistic depth and visual appeal",
      icon: "🎯",
      color: "from-orange-400 to-orange-600",
      darkColor: "from-orange-500 to-orange-700"
    },
    {
      title: "Micro Animations",
      description: "Subtle movements that bring life to the interface",
      icon: "⚡",
      color: "from-red-400 to-red-600",
      darkColor: "from-red-500 to-red-700"
    }
  ];

  const interactiveElements = [
    {
      title: "Hover Effects",
      description: "Interactive feedback on user actions",
      component: (
        <Button 
          variant="creative" 
          shimmer 
          className="animate-pulse-slow"
        >
          Hover Me ✨
        </Button>
      )
    },
    {
      title: "Scroll Animations",
      description: "Content reveals as you scroll",
      component: (
        <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold animate-float">
          Scroll 📜
        </div>
      )
    },
    {
      title: "Morphing Shapes",
      description: "Organic, fluid animations",
      component: (
        <MorphingShape 
          size="w-32 h-32" 
          color="bg-gradient-to-br from-purple-400 to-pink-400"
        />
      )
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <ScrollAnimation animation="slide-up">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Modern Design Trends
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience the latest web design innovations that enhance user experience 
              and create visually stunning interfaces.
            </p>
          </div>
        </ScrollAnimation>

        {/* Design Trends Grid */}
        <StaggeredAnimation animation="scale-in" staggerDelay={150}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {designTrends.map((trend, index) => (
              <Card3D key={index} className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${trend.color} dark:${trend.darkColor} flex items-center justify-center text-2xl text-white`}>
                  {trend.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {trend.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {trend.description}
                </p>
              </Card3D>
            ))}
          </div>
        </StaggeredAnimation>

        {/* Interactive Elements Section */}
        <ScrollAnimation animation="fade-in">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Interactive Elements
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Try these interactive components to see the animations in action
            </p>
          </div>
        </ScrollAnimation>

        <StaggeredAnimation animation="slide-up" staggerDelay={200}>
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {interactiveElements.map((element, index) => (
              <GlassCard key={index} className="p-8 text-center">
                <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  {element.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  {element.description}
                </p>
                <div className="flex justify-center">
                  {element.component}
                </div>
              </GlassCard>
            ))}
          </div>
        </StaggeredAnimation>

        {/* Parallax Section */}
        <ScrollAnimation animation="fade-in">
          <div className="relative h-96 rounded-2xl overflow-hidden mb-20">
            <ParallaxElement speed={0.3} className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-indigo-600/20 dark:from-emerald-500/20 dark:to-indigo-600/20"></div>
            </ParallaxElement>
            
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-3xl font-bold mb-4">Parallax Effect</h3>
                <p className="text-lg opacity-90">Scroll to see the background move at a different speed</p>
              </div>
            </div>

            {/* Floating shapes */}
            <FloatingElement className="absolute top-10 left-10">
              <MorphingShape size="w-20 h-20" color="bg-white/20" />
            </FloatingElement>
            <FloatingElement className="absolute bottom-10 right-10" delay={2}>
              <MorphingShape size="w-16 h-16" color="bg-white/15" />
            </FloatingElement>
          </div>
        </ScrollAnimation>

        {/* Color Branding Section */}
        <ScrollAnimation animation="fade-in">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Creative Color Branding
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Dynamic color schemes that adapt to content and context
            </p>
          </div>
        </ScrollAnimation>

        <StaggeredAnimation animation="rotate-in" staggerDelay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {[
              { name: "Primary", color: "from-emerald-400 to-emerald-600" },
              { name: "Secondary", color: "from-indigo-400 to-indigo-600" },
              { name: "Accent", color: "from-purple-400 to-purple-600" },
              { name: "Highlight", color: "from-pink-400 to-pink-600" }
            ].map((brand, index) => (
              <div key={index} className="text-center">
                <div className={`w-24 h-24 mx-auto mb-3 rounded-xl bg-gradient-to-br ${brand.color} animate-glow`}></div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{brand.name}</p>
              </div>
            ))}
          </div>
        </StaggeredAnimation>

        {/* CTA Section */}
        <ScrollAnimation animation="bounce-in">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Ready to Experience Modern Design?
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              These design trends create engaging, accessible, and beautiful user experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="creative" shimmer>
                Explore More 🚀
              </Button>
              <Button variant="glass" threeD>
                Learn Design 📚
              </Button>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default DesignShowcase; 
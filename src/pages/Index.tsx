import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { BRAND } from "@/lib/constants";
import { useCategories } from "@/hooks/useCategories";

const Index = () => {
  const { data: categories = [] } = useCategories();
  const displayCategories = categories.slice(0, 4);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-stickles-cream via-background to-stickles-cream-dark" />

        {/* Floating Decorative Elements */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-stickles-sage/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 right-[20%] w-48 h-48 bg-stickles-purple-light/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "0.5s" }} />

        {/* Main Content */}
        <div className="container relative z-10 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Sparkle Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/80 backdrop-blur-sm rounded-full text-sm font-medium text-muted-foreground animate-fade-up">
              <Sparkles className="h-4 w-4 text-primary" />
              Handpicked Accessories
            </div>

            {/* Brand Name */}
            <h1
              className="font-heading text-6xl md:text-8xl lg:text-9xl font-bold text-foreground tracking-tight animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              {BRAND.name}
            </h1>

            {/* Tagline */}
            <p
              className="text-xl md:text-2xl lg:text-3xl text-muted-foreground italic max-w-lg mx-auto animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              {BRAND.tagline}
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <Button asChild size="lg" className="group text-base px-8 py-6 rounded-full shadow-glow">
                <Link to="/catalogue">
                  Explore Collection
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8 py-6 rounded-full">
                <a href={`https://instagram.com/${BRAND.instagram}`} target="_blank" rel="noopener noreferrer">
                  Follow Us
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Find the perfect accessory to express your unique style
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {(displayCategories.length > 0 ? displayCategories.map(c => c.name) : ["Phone Charms", "Bracelets", "Bangles", "Stickers"]).map((category, i) => (
              <Link
                key={category}
                to={`/catalogue?category=${encodeURIComponent(category)}`}
                className="group relative aspect-square w-[calc(50%-1rem)] md:w-[calc(25%-1.5rem)] min-w-[140px] max-w-[280px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 hover-lift animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <span className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform">
                    {category === "Phone Charms" && "📱"}
                    {category === "Bracelets" && "💫"}
                    {category === "Bangles" && "✨"}
                    {category === "Stickers" && "🌸"}
                  </span>
                  <h3 className="font-heading text-lg md:text-xl font-semibold text-background text-center">
                    {category}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/catalogue">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: "💝", title: "Handpicked", desc: "Every piece is carefully selected" },
              { icon: "🚀", title: "Fast Delivery", desc: "Quick shipping across India" },
              { icon: "💬", title: "Easy Orders", desc: "Order directly via WhatsApp" },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="text-center p-6 rounded-2xl bg-card border border-border/50 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="text-4xl mb-4 block">{feature.icon}</span>
                <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

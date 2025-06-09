
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Coffee, Users, Target, Utensils } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <header className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Welcome to Caffico Express</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Your daily caffeine confession, brewed with passion and served with a smile. Discover our story, our coffee, and our commitment to you.
        </p>
      </header>

      <section className="mb-12 md:mb-16">
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <div className="grid md:grid-cols-2 items-center">
            <div className="relative h-64 md:h-full w-full">
              <Image 
                src="https://placehold.co/800x600.png" 
                alt="Caffico Cafe Interior" 
                fill
                style={{ objectFit: "cover" }}
                data-ai-hint="cafe interior"
                sizes="100vw"
                priority
              />
            </div>
            <div className="p-6 md:p-10">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-3xl font-semibold flex items-center"><Coffee className="mr-3 h-8 w-8 text-primary" />Our Story</CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-muted-foreground space-y-4">
                <p>
                  Caffico Express started with a simple idea: to create a space where coffee lovers could find exceptional brews and a moment of peace in their busy days. Born from a passion for quality coffee and a desire to build community, Caffico has grown from a small kiosk dream into a beloved local spot.
                </p>
                <p>
                  We believe that a great cup of coffee can change your day, and we're dedicated to making every Caffico experience memorable. From sourcing the finest beans to training our baristas, every detail is crafted with care.
                </p>
              </CardContent>
            </div>
          </div>
        </Card>
      </section>

      <section className="mb-12 md:mb-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary flex items-center justify-center"><Users className="mr-3 h-8 w-8" />Meet Our Fictional Founders</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-md rounded-lg p-6 text-center">
             <Image 
                src="https://placehold.co/150x150.png" 
                alt="Founder Anya Sharma" 
                width={120} 
                height={120} 
                className="rounded-full mx-auto mb-4"
                data-ai-hint="female founder" 
              />
            <CardTitle className="text-xl font-semibold mb-2">Anya Sharma</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mb-3">Co-founder & Chief Bean Officer</CardDescription>
            <p className="text-sm text-muted-foreground">
              Anya's journey into coffee began during her travels through South America, where she fell in love with the art and science of coffee cultivation. Her mission is to bring the world's best beans to Caffico.
            </p>
          </Card>
          <Card className="shadow-md rounded-lg p-6 text-center">
            <Image 
                src="https://placehold.co/150x150.png" 
                alt="Founder Rohan Verma" 
                width={120} 
                height={120} 
                className="rounded-full mx-auto mb-4" 
                data-ai-hint="male founder"
              />
            <CardTitle className="text-xl font-semibold mb-2">Rohan Verma</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mb-3">Co-founder & Head of Vibes</CardDescription>
            <p className="text-sm text-muted-foreground">
              Rohan believes that a coffee shop is more than just a place to get drinks – it's a community hub. He's passionate about creating a welcoming atmosphere and a seamless customer experience.
            </p>
          </Card>
        </div>
      </section>

      <section className="mb-12 md:mb-16 text-center">
        <h2 className="text-3xl font-bold mb-8 text-primary flex items-center justify-center"><Target className="mr-3 h-8 w-8" />Our Vision & Products</h2>
        <div className="max-w-3xl mx-auto text-muted-foreground space-y-4">
          <p>
            Our vision at Caffico Express is to be the leading destination for premium coffee and handcrafted shakes, known for our quality, innovation, and exceptional customer service. We aim to inspire moments of joy and connection, one cup at a time.
          </p>
          <p>
            We meticulously select our coffee beans from sustainable sources and roast them to perfection to bring out their unique flavors. Our shakes are made with high-quality ingredients, offering a delightful treat for every palate. We're constantly exploring new recipes and seasonal specials to keep your taste buds excited.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/menu" className="flex items-center">
                <Utensils className="mr-2 h-5 w-5" /> Explore Our Menu
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="text-center">
        <Card className="bg-muted/50 p-8 rounded-lg shadow-inner">
          <h2 className="text-2xl font-semibold mb-4">Join the Caffico Community</h2>
          <p className="text-muted-foreground mb-6">
            Follow us on social media for the latest updates, offers, and a peek behind the scenes!
          </p>
          <Button variant="outline" asChild>
            <a href="https://www.instagram.com/reel/DI9Ez9Qhqh2/" target="_blank" rel="noopener noreferrer">
              Follow us on Instagram
            </a>
          </Button>
        </Card>
      </section>
    </div>
  );
}

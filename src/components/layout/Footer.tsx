import { Instagram, Mail, MessageCircle } from "lucide-react";
import { BRAND, WHATSAPP_BASE_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Brand */}
          <div className="space-y-2">
            <h3 className="font-heading text-2xl font-bold text-foreground">
              {BRAND.name}
            </h3>
            <p className="text-muted-foreground italic">
              {BRAND.tagline}
            </p>
          </div>

          {/* Contact Links */}
          <div className="flex flex-wrap gap-6">
            <a
              href={`https://instagram.com/${BRAND.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Instagram className="h-5 w-5 group-hover:text-primary transition-colors" />
              <span className="text-sm">@{BRAND.instagram}</span>
            </a>

            <a
              href={`mailto:${BRAND.email}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Mail className="h-5 w-5 group-hover:text-primary transition-colors" />
              <span className="text-sm">{BRAND.email}</span>
            </a>

            <a
              href={`${WHATSAPP_BASE_URL}${BRAND.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <MessageCircle className="h-5 w-5 group-hover:text-primary transition-colors" />
              <span className="text-sm">WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

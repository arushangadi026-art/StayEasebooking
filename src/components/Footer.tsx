import type { PageRoute } from './Navbar';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const go = (page: PageRoute) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#2D1D14] text-[#F2EAE0] border-t border-[#4A3426]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-3">
            <div className="font-display text-2xl font-bold text-[#FFFDF9]">STAYEASE</div>
            <p className="text-sm text-[#D9C7B2] max-w-sm leading-relaxed">
              Find Comfort. Book with Ease. A full-stack hotel booking and management web
              application crafted for BCA III Semester Server-Side Web Development.
            </p>
            <p className="text-xs text-[#A8927E]">
              All hotels, reviews, and INR rates are fictional academic demonstration listings.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5 text-sm">
            <div className="text-xs font-semibold text-[#E6B88A] tracking-wide mb-2">
              Hospitality
            </div>
            {[
              { label: 'Home', page: 'home' as PageRoute },
              { label: 'Explore Hotels', page: 'hotels' as PageRoute },
              { label: 'Room Categories', page: 'rooms' as PageRoute },
              { label: 'Promotional Events', page: 'events' as PageRoute },
              { label: 'About & Contact', page: 'contact' as PageRoute },
            ].map((item) => (
              <button
                key={item.page}
                type="button"
                onClick={() => go(item.page)}
                className="block text-[#D9C7B2] hover:text-[#FFFDF9] transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="md:col-span-4 space-y-2.5 text-sm">
            <div className="text-xs font-semibold text-[#E6B88A] tracking-wide mb-2">
              Academic & Syllabus Links
            </div>
            <button
              type="button"
              onClick={() => go('labs')}
              className="block text-[#D9C7B2] hover:text-[#FFFDF9] transition-colors cursor-pointer"
            >
              Word (.docx) Documents & All 8 Labs
            </button>
            <a
              href="/lab5-http-server"
              className="block text-[#D9C7B2] hover:text-[#FFFDF9] transition-colors"
            >
              Lab 5: Node.js HTTP Server Response
            </a>
            <a
              href="/lab7-register.html"
              className="block text-[#D9C7B2] hover:text-[#FFFDF9] transition-colors"
            >
              Lab 7: Bootstrap 5 Registration Form
            </a>
            <a
              href="/lab8-events.html"
              className="block text-[#D9C7B2] hover:text-[#FFFDF9] transition-colors"
            >
              Lab 8: Bootstrap 5 Event Modal Page
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#4A3426] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A8927E]">
          <span>© 2026 STAYEASE Hospitality Project. Academic Demonstration Build.</span>
          <span>Node.js · Express.js · Persistent JSON Storage · Bootstrap 5</span>
        </div>
      </div>
    </footer>
  );
}

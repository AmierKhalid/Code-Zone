import { featuredProjects, features, teamMembers } from "@/constants";
import Link from "next/link";



export default function LandingHomePage() {
  return (
    <main className="min-h-screen bg-dark-1 text-light-1">
      <nav className="sticky top-0 z-40 border-b border-dark-4 bg-dark-1/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a
            href="#home"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl"
          >
            <img
              src="/images/logo.svg"
              alt="CodeZone Logo"
              className="h-8 w-8"
            />
            Code<span className="text-primary-500">Zone</span>
          </a>
          <div className="hidden items-center gap-7 md:flex">
            {["Home", "Features", "Projects", "Team", "Contact"].map(
              (label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  className="text-sm text-light-3 transition-colors hover:text-light-1"
                >
                  {label}
                </a>
              ),
            )}
          </div>
          <Link
            href="/sign-in"
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-light-1 transition hover:bg-primary-600"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section
        id="home"
        className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="relative w-full overflow-hidden rounded-3xl border border-dark-4 bg-gradient-to-br from-[#11122A] via-[#101822] to-[#25123A] p-7 shadow-[0_0_60px_-30px_rgba(135,126,255,0.8)] md:p-10">
          <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-primary-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />

          <p className="small-semibold mb-3 text-primary-500">
            DEVELOPER SOCIAL PLATFORM
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-light-1 md:text-5xl">
            Build. Share. Connect.
            <br />
            <span className="bg-gradient-to-r from-primary-500 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
              Like VS Code energy, but for your community.
            </span>
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-light-3 md:text-base">
            CodeZone is the ultimate developer social platform where you can
            share your coding projects, receive constructive feedback, connect
            with like-minded developers, and build your professional network.
            Turn your passion projects into portfolio pieces that get noticed.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-light-1 transition hover:bg-primary-600"
            >
              Get Started
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl border border-primary-500/60 bg-dark-2/80 px-5 py-3 text-sm font-semibold text-light-2 transition hover:bg-dark-3"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Active Devs", value: "28K+" },
              { label: "Projects Shared", value: "63K+" },
              { label: "Messages Sent", value: "1.2M+" },
              { label: "Weekly Reach", value: "410K" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-dark-4 bg-dark-2/60 p-3"
              >
                <p className="text-lg font-bold text-light-1">{stat.value}</p>
                <p className="small-regular text-light-4">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      >
        <h2 className="h3-bold md:h2-bold mb-6 w-full text-left">
          Platform Highlights
        </h2>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-dark-4 bg-dark-2/90 p-5 transition hover:border-primary-500/70 hover:bg-dark-3"
            >
              <h3 className="body-bold text-light-1">{feature.title}</h3>
              <p className="mt-2 small-regular leading-6 text-light-3">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="projects"
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <h2 className="h3-bold md:h2-bold mb-6 w-full text-left">
          Featured Projects
        </h2>
        <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
          {featuredProjects.map((project) => (
            <article
              key={project.title}
              className="overflow-hidden rounded-2xl border border-dark-4 bg-dark-2"
            >
              <div className="h-44 bg-gradient-to-r from-primary-600/35 via-fuchsia-500/20 to-cyan-400/25" />
              <div className="space-y-3 p-5">
                <h3 className="body-bold text-light-1">{project.title}</h3>
                <p className="small-regular text-light-3">
                  {project.description}
                </p>
                <p className="tiny-medium uppercase tracking-[0.14em] text-light-4">
                  Photo: {project.imageLabel}
                </p>
                <div className="flex items-center gap-2 text-xs text-light-3">
                  <span className="rounded-full bg-dark-3 px-2.5 py-1">
                    Reach: {project.reach}
                  </span>
                  <span className="rounded-full bg-dark-3 px-2.5 py-1">
                    Engagement: {project.engagement}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="team"
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <h2 className="h3-bold md:h2-bold mb-6 w-full text-left">Team</h2>
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="rounded-2xl border border-dark-4 bg-dark-2 p-5 text-center transition hover:border-primary-500/70"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/20 text-lg font-bold text-primary-500">
                {member.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <h3 className="small-semibold text-light-2">{member.name}</h3>
              <p className="small-regular mt-1 text-light-3">{member.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
      >
        <div className="grid gap-6 rounded-2xl border border-dark-4 bg-dark-2 p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <h2 className="h3-bold md:h2-bold">Contact Us</h2>
            <p className="mt-3 max-w-xl text-light-3">
              Have an idea, partnership request, or feedback? Send us a message
              and the CodeZone team will get back to you soon.
            </p>
            <div className="mt-6">
              <Link
                href="/sign-in"
                className="inline-flex rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-light-1 transition hover:bg-primary-600"
              >
                Get Started
              </Link>
            </div>
          </div>
          <form className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="w-full rounded-xl border border-dark-4 bg-dark-3 px-4 py-3 text-sm text-light-2 placeholder:text-light-4 outline-none transition focus:border-primary-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full rounded-xl border border-dark-4 bg-dark-3 px-4 py-3 text-sm text-light-2 placeholder:text-light-4 outline-none transition focus:border-primary-500"
            />
            <textarea
              name="message"
              placeholder="Message"
              rows={4}
              className="w-full rounded-xl border border-dark-4 bg-dark-3 px-4 py-3 text-sm text-light-2 placeholder:text-light-4 outline-none transition focus:border-primary-500"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-light-1 transition hover:bg-primary-600"
            >
              Submit
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

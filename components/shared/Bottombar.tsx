"use client";

import Link from "next/link";

import { bottombarLinks } from "@/constants";
import { usePathname } from "next/navigation";

const Bottombar: React.FC = () => {
  const pathname = usePathname();

  return (
    <section className="bottom-bar">
      {bottombarLinks.map((link) => {
        const isActive = pathname === link.route;
        return (
          <Link
            href={link.route}
            key={link.label}
            className={`flex-center flex-col gap-1 p-2 rounded-lg transition-all duration-200 ease-in-out group ${
              isActive
                ? "bg-primary-500 scale-105 shadow-lg"
                : ""
            }`}
          >
            <img
              width={24}
              height={24}
              className={`transition-colors duration-200 ${
                isActive ? "invert-white" : ""
              }`}
              src={link.imgURL}
              alt={link.label}
            />
            <p className="tiny-medium text-light-2">{link.label}</p>
          </Link>
        );
      })}
    </section>
  );
};

export default Bottombar;

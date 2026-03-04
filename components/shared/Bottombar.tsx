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
            className={`flex-center transition flex-col gap-1 p-2 ${
              isActive ? "bg-primary-500 rounded-[10px]" : ""
            }`}
          >
            <img
              width={16}
              height={16}
              className={`group-hover:invert-white ${
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

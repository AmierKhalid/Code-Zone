import React, { ReactNode } from "react";
import Image from "next/image";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="h-screen w-full flex bg-dark-1 overflow-hidden">
      <section className="flex flex-1 justify-center items-center flex-col py-10">
        <div className="flex items-center gap-3 mb-3">
          <Image
            src="/images/logo.svg"
            alt="Logo"
            width={60}
            height={50}
            className="object-cover"
          />
          <h1 className="text-[36px] font-bold">
            Code<span className="text-fuchsia-500">Zone</span>
          </h1>
        </div>

        {children}
      </section>

      <Image
        src="/images/side-img.svg"
        alt="side image"
        width={800}
        height={800}
        className="hidden xl:block h-screen rounded-l-full w-1/2 object-cover bg-no-repeat"
      />
    </main>
  );
};

export default Layout;

//we will use next auth for authentication management
//check clickup for more details
import React, { ReactNode } from "react";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="h-screen w-full flex bg-dark-1 overflow-hidden">
      <section className="flex flex-1 justify-center items-center flex-col py-10">
        <div className="flex items-center gap-3 mb-3">
          <img
            src="/images/logo.svg"
            alt="Logo"
            className="w-[60px] h-[50px] object-cover"
          />
          <h1 className="text-[36px] font-bold">
            Code<span className="text-fuchsia-500">Zone</span>
          </h1>
        </div>
        {children}
      </section>
      <img
        src="/images/side-img.svg"
        className="hidden xl:block h-screen rounded-l-full w-1/2 object-cover bg-no-repeat"
        alt="side image"
      />
    </main>
  );
};

export default layout;

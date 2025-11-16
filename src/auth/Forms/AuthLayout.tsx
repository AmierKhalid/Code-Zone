import { Outlet ,Navigate } from "react-router-dom";

const AuthLayout = () => {
  const isAuthenticated = false;
  return (
    <>
      {/* <h1 className="text-orange-600 font-bold">Auth Layout</h1> */}
      {isAuthenticated ?(<Navigate to="/" />):(
        <>
        <section className="flex flex-1 justify-center items-center flex-col py-10">
          <Outlet />
        </section>
        <img src="/public/assets/images/side-img.svg" className=" hidden xl:block h-screen rounded-l-full w-1/2 object-cover bg-no-repeat"/>
        </>
      )
    }
    </>
  )
}

export default AuthLayout

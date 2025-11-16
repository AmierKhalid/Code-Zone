import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route } from "react-router-dom";
import AuthLayout from "./auth/Forms/AuthLayout";
import SigninPage from "./auth/Forms/SigninPage";
import SignupPage from "./auth/Forms/SignupPage";
import RootLayout from "./root/RootLayout";
import { AllUsers, CreatePost, EditPost, Explore, Home, PostDetails, Profile, Saved, UpdateProfile } from "./root/pages/";
import CreateSamplePosts from "./root/pages/CreateSamplePosts";
import "./globals.css"

const App = () => {
  return (
    <main className="flex w-full h-screen">
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/sign-in" element={<SigninPage />} />
          <Route path="/sign-up" element={<SignupPage />} />
        </Route>
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/all-users" element={<AllUsers />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/create-sample-posts" element={<CreateSamplePosts />} />
          <Route path="/update-post/:id" element={<EditPost />} />
          <Route path="/posts/:id" element={<PostDetails />} />
          <Route path="/profile/:id/*" element={<Profile />} />
          <Route path="/update-profile/:id" element={<UpdateProfile />} />
        </Route>
      </Routes>
      <Toaster/>
    </main>
  );
};

export default App;

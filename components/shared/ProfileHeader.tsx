import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ProfileUser } from "@/lib/profileData";
import ProfileBackButton from "./ProfileBackButton";
import ProfileTabs from "./ProfileTabs";

type StatBlockProps = {
  value: string | number;
  label: string;
};

function StatBlock({ value, label }: StatBlockProps) {
  return (
    <div className="flex-center gap-2">
      <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
      <p className="small-medium lg:base-medium text-light-2">{label}</p>
    </div>
  );
}

type ProfileHeaderProps = {
  profile: ProfileUser;
  profileId: string;
  currentUserId: string | null;
};

export default function ProfileHeader({
  profile,
  profileId,
  currentUserId,
}: ProfileHeaderProps) {
  const isOwnProfile = currentUserId === profileId;
  const imageSrc = profile.image || "/icons/profile-placeholder.svg";

  return (
    <>
      <ProfileBackButton />

      <div className="profile-inner_container">
        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
          <img
            src={imageSrc}
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full object-cover"
          />

          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                {profile.name ?? profile.username ?? "User"}
              </h1>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{profile.username ?? "username"}
              </p>
            </div>

            <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={profile.postsCount} label="Posts" />
              <StatBlock value={profile.followersCount} label="Followers" />
              <StatBlock value={profile.followingCount} label="Following" />
            </div>

            {profile.bio && (
              <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm text-light-2">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {isOwnProfile && (
              <Link
                href={`/update-profile/${profileId}`}
                className="h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg"
              >
                <img src="/icons/edit.svg" alt="edit" width={20} height={20} />
                <p className="flex whitespace-nowrap small-medium">Edit Profile</p>
              </Link>
            )}
            {!isOwnProfile && (
              <Button type="button" className="shad-button_primary px-8">
                Follow
              </Button>
            )}
          </div>
        </div>
      </div>

      {isOwnProfile && <ProfileTabs profileId={profileId} />}
    </>
  );
}

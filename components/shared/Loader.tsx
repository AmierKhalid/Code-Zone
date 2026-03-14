

const Loader = () => {
  return (
    <div className="flex-center w-full cursor-progress animate-pulse ">
      <img srcSet="/icons/loader.svg 2x" alt="Loading..."
        className="cursor-progress animate-pulse"
        src="/icons/loader.svg"
        width={24}
        height={24}
      />
    </div>
  );
};

export default Loader;

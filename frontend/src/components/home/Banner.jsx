const Banner = ({ desktopImage, mobileImage, alt = "banner", link = "/" }) => {
  return (
    <div className="w-full">
      <a href={"https://spiritualrevamp.com/collections"}>
        <picture>
          <source media="(max-width: 768px)" srcSet={"https://res.cloudinary.com/df9ftwtis/image/upload/v1776689258/spiritual-revamp/media/ljfuidnpcmtvg7smjc1q.png"} />
          <img
            src={"https://res.cloudinary.com/df9ftwtis/image/upload/v1776689259/spiritual-revamp/media/wwlf1tajydzqaxezhpdb.png"}
            alt={alt}
            className="w-full h-auto object-cover"
          />
        </picture>
      </a>
    </div>
  );
};

export default Banner;
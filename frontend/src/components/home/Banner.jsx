const Banner = ({ desktopImage, mobileImage, alt = "banner", link = "/" }) => {
  return (
    <div className="w-full">
      <a href={"https://spiritual-revamp.vercel.app/collections"}>
        <picture>
          <source media="(max-width: 768px)" srcSet={"https://res.cloudinary.com/df9ftwtis/image/upload/v1776063024/spiritual-revamp/media/wh3wyjdj7jzuazkibxyo.webp"} />
          <img
            src={"https://res.cloudinary.com/df9ftwtis/image/upload/v1776063024/spiritual-revamp/media/yva3i8ndznacirrvkc7o.webp"}
            alt={alt}
            className="w-full h-auto object-cover"
          />
        </picture>
      </a>
    </div>
  );
};

export default Banner;
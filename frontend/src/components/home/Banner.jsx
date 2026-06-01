import { Link } from 'react-router-dom';

const Banner = () => {
  return (
    <div className="w-full">
      <Link to="/collections">
        <picture>
          <source
            media="(max-width: 768px)"
            srcSet="https://res.cloudinary.com/df9ftwtis/image/upload/v1776689258/spiritual-revamp/media/ljfuidnpcmtvg7smjc1q.png"
          />
          <img
            src="https://res.cloudinary.com/df9ftwtis/image/upload/v1776689259/spiritual-revamp/media/wwlf1tajydzqaxezhpdb.png"
            alt="Spiritual Revamp — Premium Crystal Bracelets Collection"
            className="w-full h-auto object-cover"
          />
        </picture>
      </Link>
    </div>
  );
};

export default Banner;

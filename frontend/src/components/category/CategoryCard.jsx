import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import React from 'react';
/**
 * CategoryCard – a premium card component for the category section.
 * Displays a small image with a subtle glassmorphism effect.
 *
 * Props:
 *  - name: Category name (e.g., "Medicines")
 *  - image: Image URL for the category (should be a square thumbnail)
 *  - href: Link to the category page (e.g., `/medicines?category=Medicines`)
 *  - bgColor: Tailwind background color class for the card backdrop.
 */
const CategoryCard = ({ name, image, href, bgColor }) => {
  const [imgSrc, setImgSrc] = React.useState(image);
  const handleError = () => setImgSrc(`https://placehold.co/400x400/EEE/31343C?text=${encodeURIComponent(name)}`);
  
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      className={`relative group ${bgColor} rounded-2xl overflow-hidden shadow-lg transition-shadow`}
    >
      <Link to={href} className="block w-full h-full">
        {/* Image */}
        <div className="relative pt-[100%]">
          <img
            src={imgSrc}
            alt={name}
            onError={handleError}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Gradient overlay for premium look */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          {/* Category name */}
          <div className="absolute bottom-2 left-2 right-2 text-center text-sm font-medium text-white bg-black/40 rounded py-1 backdrop-blur-sm">
            {name}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};



CategoryCard.defaultProps = {
  bgColor: 'bg-white',
};

export default CategoryCard;

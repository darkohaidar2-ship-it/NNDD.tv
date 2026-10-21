import React from 'react';
import DabinLogo from './DabinLogo';

/**
 * Backward compatibility re-export:
 * Redirects all previous NnddLogo usage to the official DABIN.Tv Logo.
 */
export default function NnddLogo(props) {
  return <DabinLogo {...props} />;
}

export { DabinLogo };

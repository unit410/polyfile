import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { forwardRef, AnchorHTMLAttributes } from 'react';

type NextComposedProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & NextLinkProps;

const Link = forwardRef<HTMLAnchorElement, NextComposedProps>((props, ref) => {
  const { as, href, replace, scroll, passHref, shallow, prefetch, ...other } = props;

  return (
    <NextLink
      href={href}
      prefetch={prefetch}
      as={as}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      passHref={passHref}
    >
      <a ref={ref} {...other} />
    </NextLink>
  );
});

export default Link;

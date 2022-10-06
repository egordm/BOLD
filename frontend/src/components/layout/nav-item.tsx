import PropTypes from 'prop-types';
import { Box, Button, Link as LinkExt, ListItem } from '@mui/material';
import { useLocation } from "react-router";
import { Link } from "react-router-dom";

const LinkMe = ({ children, href, external = false, ...props }: { children, href: string, external: boolean } | any) =>(
  external ? (
    <LinkExt href={href} target="_blank" {...props}>
      {children}
    </LinkExt>
  ) : (
    <Link to={href} {...props}>
      {children}
    </Link>
  )
)

export const NavItem = (props) => {
  const { href, icon, title, external = false, ...others } = props;
  const location = useLocation();
  const active = href ? (location.pathname === href) : false;

  return (
    <ListItem
      disableGutters
      sx={{
        display: 'flex',
        mb: 0.5,
        py: 0,
        px: 2
      }}
      {...others}
    >
      <LinkMe
        href={href}
        external={external}
        style={{flex: 1}}>
        <Button
          startIcon={icon}
          disableRipple
          sx={{
            backgroundColor: active && 'rgba(255,255,255, 0.08)',
            borderRadius: 1,
            color: active ? 'secondary.main' : 'neutral.300',
            fontWeight: active && 'fontWeightBold',
            justifyContent: 'flex-start',
            px: 3,
            textAlign: 'left',
            textTransform: 'none',
            width: '100%',
            '& .MuiButton-startIcon': {
              color: active ? 'secondary.main' : 'neutral.400'
            },
            '&:hover': {
              backgroundColor: 'rgba(255,255,255, 0.08)'
            }
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            {title}
          </Box>
        </Button>
      </LinkMe>
    </ListItem>
  );
};

NavItem.propTypes = {
  href: PropTypes.string,
  icon: PropTypes.node,
  title: PropTypes.string,
  external: PropTypes.bool,
};

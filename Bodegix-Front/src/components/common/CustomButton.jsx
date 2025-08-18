import React from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';

const CustomButton = ({ children, variant, color, size, fullWidth, ...props }) => {
  return (
    <Button
      variant={variant || 'contained'}
      color={color || 'primary'}
      size={size || 'medium'}
      fullWidth={fullWidth || false}
      sx={{
        textTransform: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

CustomButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.string,
  fullWidth: PropTypes.bool,
};

export default CustomButton;
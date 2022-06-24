import { useSnackbar } from 'notistack';
import React from "react";


const useNotification = () => {
  const [ notification, setNotification ] = React.useState<{
    message?: string;
    variant: 'default' | 'error' | 'success' | 'warning' | 'info';
  }>({
    message: undefined,
    variant: 'default',
  });
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (notification?.message) {
      let variant = 'info';
      if (notification.variant) {
        variant = notification.variant;
      }
      enqueueSnackbar(notification.message, {
        // @ts-ignore
        variant: variant,
        autoHideDuration: 5000,
      });
    }
  }, [ notification ]);
  return {
    notification,
    sendNotification: setNotification
  };
};

export default useNotification;

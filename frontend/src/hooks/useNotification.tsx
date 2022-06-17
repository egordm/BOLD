import { useSnackbar } from 'notistack';
// import IconButton from "@mui/material/IconButton";
// import CloseIcon from "@mui/material/SvgIcon/SvgIcon";
import React, {useEffect, useState} from "react";


const useNotification = (): [
  {  msg?: string;  variant: 'default' | 'error' | 'success' | 'warning' | 'info';  },
  (value: { msg: string; variant: 'default' | 'error' | 'success' | 'warning' | 'info'; }) => void

] => {
  const [conf, setConf] = useState<{
    msg?: string;
    variant: 'default' | 'error' | 'success' | 'warning' | 'info';
  }>({
    msg: undefined,
    variant: 'default',
  });
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  useEffect(()=>{
    if(conf?.msg){
      let variant = 'info';
      if(conf.variant){
        variant = conf.variant;
      }
      enqueueSnackbar(conf.msg, {
        // @ts-ignore
        variant: variant,
        autoHideDuration: 5000,
      });
    }
  },[conf]);
  return [
    conf,
    setConf
  ];
};

export default useNotification;

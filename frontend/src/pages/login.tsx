// import Head from 'next/head';
import {
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  Paper, TextField, Typography
} from '@mui/material';
import React, { useEffect } from "react";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuthContext } from "../providers/AuthProvider";
import { useNavigate } from "react-router-dom";



const LoginPage = () => {
  const { user, loginUser } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.debug('Sending login request');
    loginUser(
      data.get('username') as string,
      data.get('password') as string
    );
  };

  return (
    <>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container component="main" maxWidth="xs">
          <CssBaseline/>
          <Paper elevation={3} sx={{p: 3}} >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                <LockOutlinedIcon/>
              </Avatar>
              <Typography component="h1" variant="h5">
                Sign in
              </Typography>
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                />
{/*                <FormControlLabel
                  control={<Checkbox value="remember" color="primary"/>}
                  label="Remember me"
                />*/}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Sign In
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}

LoginPage.getLayout = (page) => (
  page
);

export default LoginPage;

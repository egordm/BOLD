import {
  Card,
  CardActions,
  CardContent,
  Collapse,
  IconButton,
  IconButtonProps,
  List, ListItem, ListItemButton,
  ListItemIcon, ListItemText,
  Typography
} from "@mui/material"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { useTasksContext } from "../../providers/TasksProvider";

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));


export const TasksWidget = (props: {}) => {
  const [ expanded, setExpanded ] = useState(false);
  const {tasks} = useTasksContext();

  const taskList = Object.values(tasks).map((task) => task);

  return (
    <Card sx={{
      width: 345,
      position: 'fixed',
      bottom: '16px',
      right: '16px',
    }}>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph>Method:</Typography>
          <List>
            {taskList.map(task => (
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon>
                    {task.state === 'SUCCESS' ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
                  </ListItemIcon>
                  <ListItemText primary={`Task ${task.task_id.substring(0, 6)}`} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Collapse>
      <CardActions disableSpacing>
        <IconButton aria-label="add to favorites">
          <FavoriteIcon/>
        </IconButton>
        <ExpandMore
          expand={expanded}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <ExpandMoreIcon/>
        </ExpandMore>
      </CardActions>
    </Card>
  )
}

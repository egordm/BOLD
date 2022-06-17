import {
  Card,
  CardActions,
  CardContent, CircularProgress,
  Collapse,
  Divider,
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
import _ from "lodash";
import { useState } from "react";
import { useTasksContext } from "../../providers/TasksProvider";
import { Task } from "../../types/tasks";
import FilterNoneIcon from '@mui/icons-material/FilterNone';

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

const IN_PROGRESS_STATES = new Set([ 'PENDING', 'STARTED' ]);

const isTaskRunning = (task: Task) => IN_PROGRESS_STATES.has(task.state);


export const TasksWidget = (props: {}) => {
  const [ expanded, setExpanded ] = useState(false);
  const { tasks } = useTasksContext();

  const taskList = _.sortBy(Object.values(tasks), 'created');
  const tasksInProgress = taskList.filter(isTaskRunning);

  return (
    <Card sx={{
      width: 345,
      position: 'fixed',
      bottom: '16px',
      right: '16px',
    }}>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List sx={{maxHeight: 400, overflowY: 'auto'}}>
          {taskList.map(task => (
            <ListItem disablePadding key={task.task_id}>
              <ListItemButton>
                <ListItemIcon>
                  {
                    isTaskRunning(task)
                      ? <CircularProgress size={24}/>
                      : task.state === 'SUCCESS'
                        ? <CheckCircleOutlineIcon/>
                        : <ErrorOutlineIcon/>
                  }
                </ListItemIcon>
                <ListItemText primary={`Task ${task.task_id.substring(0, 6)}`}/>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider/>
      </Collapse>
      <CardActions disableSpacing>
        <IconButton aria-label="add to favorites">
          {tasksInProgress.length > 0 ? <CircularProgress size={24}/> : <FilterNoneIcon/>}
        </IconButton>
        <Typography paragraph sx={{ mb: 0, ml: 2 }}>
          {tasksInProgress.length > 0 ? `${tasksInProgress.length} tasks in progress` : 'No tasks in progress'}
        </Typography>
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

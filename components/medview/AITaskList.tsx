import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface Task {
    id: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    completed: boolean;
}

interface AITaskListProps {
    tasks: Task[];
    onToggle: (id: string) => void;
    className?: string;
}

export const AITaskList: React.FC<AITaskListProps> = ({ tasks, onToggle, className }) => {
    return (
        <Card className={cn("border-t-4 border-t-indigo-500 shadow-sm", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    Pending Tasks
                    <Badge variant="secondary" className="ml-auto text-xs font-normal">
                        {tasks.filter(t => !t.completed).length} remaining
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {tasks.map((task) => (
                    <div key={task.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50 transition-colors">
                        <Checkbox
                            id={task.id}
                            checked={task.completed}
                            onCheckedChange={() => onToggle(task.id)}
                            className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor={task.id}
                                className={cn(
                                    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                                    task.completed && "line-through text-muted-foreground"
                                )}
                            >
                                {task.description}
                            </label>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={task.priority === 'high' ? 'destructive' : 'outline'}
                                    className={cn(
                                        "text-[10px] px-1.5 py-0 h-4 font-normal",
                                        task.priority === 'medium' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                                        task.priority === 'low' && "text-muted-foreground"
                                    )}
                                >
                                    {task.priority}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

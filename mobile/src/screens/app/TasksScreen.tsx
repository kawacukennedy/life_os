import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';

import {AppTabParamList} from '../../navigation/AppNavigator';

type Props = BottomTabScreenProps<AppTabParamList, 'Tasks'>;

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

const TasksScreen: React.FC<Props> = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
  });

  const queryClient = useQueryClient();
  const userId = 'user123'; // In real app, get from auth context

  const {data: tasks, isLoading} = useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?userId=${userId}`);
      return response.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId, ...taskData}),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tasks', userId]});
      setModalVisible(false);
      setNewTask({title: '', description: '', priority: 'medium', dueDate: ''});
      Alert.alert('Success', 'Task created successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create task');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({taskId, updates}: {taskId: string; updates: any}) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updates),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tasks', userId]});
      setEditingTask(null);
      Alert.alert('Success', 'Task updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tasks', userId]});
      Alert.alert('Success', 'Task deleted successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete task');
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    createTaskMutation.mutate(newTask);
  };

  const handleUpdateTask = (taskId: string, updates: any) => {
    updateTaskMutation.mutate({taskId, updates});
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: () => deleteTaskMutation.mutate(taskId)},
      ],
    );
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate || '',
    });
    setModalVisible(true);
  };

  const handleEditTask = () => {
    if (!editingTask || !newTask.title.trim()) return;
    handleUpdateTask(editingTask.id, newTask);
    setModalVisible(false);
    setEditingTask(null);
    setNewTask({title: '', description: '', priority: 'medium', dueDate: ''});
  };

  const pendingTasks = tasks?.filter((task: Task) => task.status === 'pending') || [];
  const completedTasks = tasks?.filter((task: Task) => task.status === 'completed') || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingTask(null);
            setNewTask({title: '', description: '', priority: 'medium', dueDate: ''});
            setModalVisible(true);
          }}>
          <Text style={styles.addButtonText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading tasks...</Text>
        ) : (
          <>
            {pendingTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending ({pendingTasks.length})</Text>
                {pendingTasks.map((task: Task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskCard}
                    onPress={() => openEditModal(task)}
                    onLongPress={() => handleDeleteTask(task.id)}>
                    <View style={[styles.priorityIndicator, {backgroundColor: getPriorityColor(task.priority)}]} />
                    <View style={styles.taskContent}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      {task.description && (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      )}
                      {task.dueDate && (
                        <Text style={styles.taskDueDate}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleUpdateTask(task.id, {status: 'completed'})}>
                      <Text style={styles.completeButtonText}>✓</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {completedTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Completed ({completedTasks.length})</Text>
                {completedTasks.map((task: Task) => (
                  <View key={task.id} style={[styles.taskCard, styles.completedTask]}>
                    <View style={[styles.priorityIndicator, {backgroundColor: '#10b981'}]} />
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, styles.completedText]}>{task.title}</Text>
                      {task.description && (
                        <Text style={[styles.taskDescription, styles.completedText]}>{task.description}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {pendingTasks.length === 0 && completedTasks.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No tasks yet</Text>
                <Text style={styles.emptyStateSubtext}>Tap the + button to add your first task</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Task title"
              value={newTask.title}
              onChangeText={(text) => setNewTask({...newTask, title: text})}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={newTask.description}
              onChangeText={(text) => setNewTask({...newTask, description: text})}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityButtons}>
              {(['low', 'medium', 'high'] as const).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    newTask.priority === priority && styles.priorityButtonActive,
                    {borderColor: getPriorityColor(priority)},
                  ]}
                  onPress={() => setNewTask({...newTask, priority})}>
                  <Text style={[
                    styles.priorityButtonText,
                    newTask.priority === priority && styles.priorityButtonTextActive,
                  ]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Due date (YYYY-MM-DD)"
              value={newTask.dueDate}
              onChangeText={(text) => setNewTask({...newTask, dueDate: text})}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={editingTask ? handleEditTask : handleCreateTask}>
                <Text style={styles.saveButtonText}>
                  {editingTask ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4f46e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedTask: {
    opacity: 0.7,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  taskDueDate: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: '#10b981',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderWidth: 2,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#4f46e5',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TasksScreen;
import { StyleSheet, View, FlatList } from 'react-native';
import { PostQuiz } from '../../types';
import theme from '../../theme';
import { Card, Text } from 'react-native-paper';

import QuizQuestion from './QuizQuestion';

interface props {
    postInfo: PostQuiz;
}

export default function MakePostQuiz({ postInfo }: props) {
    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <Card style={styles.titleCard}>
                <Card.Content>
                    <Text variant="titleLarge">{postInfo.title}</Text>
                    <Text variant="bodyMedium">{postInfo.text}</Text>
                </Card.Content>
            </Card>

            <FlatList
                data={postInfo.questions}
                renderItem={({ item }) => <QuizQuestion questionInfo={item} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    titleCard: {
        borderRadius: 0,
    },
});

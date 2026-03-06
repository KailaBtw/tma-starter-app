import { StatusBar, View, StyleSheet, Text } from 'react-native';
import {
    MultipleChoiceQuestion,
    SelectAllQuestion,
    TrueFalseQuestion,
} from '../../types';
import { List } from 'react-native-paper';

interface props {
    questionInfo:
        | MultipleChoiceQuestion
        | SelectAllQuestion
        | TrueFalseQuestion;
}

export default function QuizQuestion({ questionInfo }: props) {
    function displayQuestion() {
        if (questionInfo.type === 'multiple_choice') {
            return (questionInfo as MultipleChoiceQuestion).options.map(
                (option, index) => (
                    <List.Item
                        key={index}
                        style={styles.options}
                        title={option}
                        titleNumberOfLines={0}
                        left={(props) => (
                            <List.Icon {...props} icon="circle-outline" />
                        )}
                    />
                )
            );
        } else if (questionInfo.type === 'select_all') {
            return (questionInfo as SelectAllQuestion).options.map(
                (option, index) => (
                    <List.Item
                        key={index}
                        style={styles.options}
                        title={option}
                        titleNumberOfLines={0}
                        left={(props) => (
                            <List.Icon {...props} icon="square-outline" />
                        )}
                    />
                )
            );
        } else if (questionInfo.type === 'true_false') {
            return (
                <>
                    <List.Item
                        style={styles.options}
                        title="True"
                        titleNumberOfLines={0}
                        left={(props) => (
                            <List.Icon {...props} icon="circle-outline" />
                        )}
                    />
                    <List.Item
                        style={styles.options}
                        title="False"
                        titleNumberOfLines={0}
                        left={(props) => (
                            <List.Icon {...props} icon="circle-outline" />
                        )}
                    />
                </>
            );
        }
    }

    return (
        <View style={styles.item}>
            <Text style={styles.title}>{questionInfo.question}</Text>
            {displayQuestion()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: StatusBar.currentHeight || 0,
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    title: {
        fontSize: 24,
    },
    options: {
        flexWrap: 'wrap',
    },
});

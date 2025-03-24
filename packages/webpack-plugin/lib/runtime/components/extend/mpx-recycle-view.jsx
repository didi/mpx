import React, { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  SectionList,
  StatusBar,
} from 'react-native';

  const Item = global.__mpxOptionsMap._e0b4ebfc

const App = (props = {}, ref) => {
  const { listData } = props
  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={listData}
        stickySectionHeadersEnabled={true}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => <Item currentItem={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.header}>{title}</Text>
        )}
      />
    </SafeAreaView>
  )

}

const styles = StyleSheet.create({
  container: {
    height: 500,
    paddingTop: StatusBar.currentHeight,
    marginHorizontal: 16,
    backgroundColor: 'red'
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
  },
  header: {
    fontSize: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
  },
});

export default App;
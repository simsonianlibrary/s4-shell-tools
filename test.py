from kivy.metrics import dp

from kivymd.app import MDApp
from kivymd.uix.datatables import MDDataTable
from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.floatlayout import MDFloatLayout
from kivymd.uix.textfield import MDTextField
from kivy.clock import Clock
import pyperclip

glines = []

with open("example/src/strings.txt", "r") as strings:
	lines = strings.readlines()
	for line in lines:
	    glines.append( (line.rstrip(),))
#	print(lines)

print(glines)

class StringSearch(MDApp):
    def build(self):
        self.layout = MDFloatLayout()
        self.data_tables = MDDataTable(
            use_pagination=False,
            check=True,
            column_data=[
                ("Value", dp(300)),
            ],
            row_data=glines,
            sorted_on="Value",
            sorted_order="ASC",
            elevation=2,
        )
        self.data_tables.bind(on_row_press=self.on_row_press)
        self.data_tables.bind(on_check_press=self.on_check_press)
        self.search_field = MDTextField(text='',height=32)
        self.search_field.bind(on_text_validate=self.search_strings)
        self.layout.add_widget(self.data_tables)
        self.layout.add_widget(self.search_field)
        screen = MDScreen()
        screen.add_widget(self.layout)
        return screen

    def search_strings(self, instance_textfield):
        print(instance_textfield.text)
        self.fill_table(instance_textfield.text)

    def on_row_press(self, instance_table, instance_row):
        '''Called when a table row is clicked.'''
#         pyperclip.copy(instance_row.)
        start_index, end_index = instance_row.table.recycle_data[instance_row.index]["range"]
        value = instance_row.table.recycle_data[start_index]["text"]
        print(value)
        pyperclip.copy(value)
#         self.data_tables.row_data = [("New Data",),("New Data 2",)]


    def on_check_press(self, instance_table, current_row):
        '''Called when the check box in the table row is checked.'''

        print(instance_table, current_row)

    # Sorting Methods:
    # since the https://github.com/kivymd/KivyMD/pull/914 request, the
    # sorting method requires you to sort out the indexes of each data value
    # for the support of selections.
    #
    # The most common method to do this is with the use of the builtin function
    # zip and enumerate, see the example below for more info.
    #
    # The result given by these funcitons must be a list in the format of
    # [Indexes, Sorted_Row_Data]

    def sort_on_signal(self, data):
        return zip(*sorted(enumerate(data), key=lambda l: l[1][2]))

    def sort_on_schedule(self, data):
        return zip(
            *sorted(
                enumerate(data),
                key=lambda l: sum(
                    [
                        int(l[1][-2].split(":")[0]) * 60,
                        int(l[1][-2].split(":")[1]),
                    ]
                ),
            )
        )

    def sort_on_team(self, data):
        return zip(*sorted(enumerate(data), key=lambda l: l[1][-1]))

    def fill_table(self,search_pattern=None):
        datalines = []
        with open("example/src/strings.txt", "r") as strings:
      	    lines = strings.readlines()
      	    for line in lines:
      	        if search_pattern is not None and search_pattern.lower() in line.lower():
      	            datalines.append( (line.rstrip(),))

        self.data_tables.row_data = datalines
        Clock.schedule_once(self.focus_search_field)

    def focus_search_field(self,search_field):
        self.search_field.focus = True
        self.search_field.select_all()

StringSearch().run()

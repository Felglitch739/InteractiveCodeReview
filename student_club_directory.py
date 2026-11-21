# Final Project
# Jeremy Hernández
# Sara Astorga
# Felix Martinez
# Prompt #8 - Student Club Member Directory


def format_member(name, role):
    return "Name: " + name + " | Role: " + role


def show_directory(member_list, member_roles):
    print("\n========== MEMBER DIRECTORY ==========")
    if len(member_list) == 0:
        print("The directory is empty.")
    else:
        for i in range(len(member_list)):
            print(str(i + 1) + ". " + format_member(member_list[i], member_roles[i]))
        print("Total members: " + str(len(member_list)))


def choose_role():
    role = ""
    while role == "":
        print("\n1.) Member")
        print("2.) President")
        print("3.) Vice President")
        print("4.) Secretary")
        print("5.) Treasurer")
        role_choice = input("Select a role number: ")
        if role_choice == "1":
            role = "Member"
        elif role_choice == "2":
            role = "President"
        elif role_choice == "3":
            role = "Vice President"
        elif role_choice == "4":
            role = "Secretary"
        elif role_choice == "5":
            role = "Treasurer"
        else:
            print("Invalid role. Please choose a number from 1 to 5.")
    return role


def choose_member(member_list, member_roles):
    show_directory(member_list, member_roles)
    position = -1
    member_choice = ""
    while position == -1 and member_choice != "0":
        member_choice = input("Enter a member number, or 0 to cancel: ")
        for i in range(len(member_list)):
            if member_choice == str(i + 1):
                position = i
        if position == -1 and member_choice != "0":
            print("Invalid member number. Please try again.")
    return position


def save_directory(member_list, member_roles):
    output_file = open("directory.txt", "w")
    for i in range(len(member_list)):
        output_file.write(format_member(member_list[i], member_roles[i]) + "\n")
    output_file.close()


member_list = []
member_roles = []

output_file = open("directory.txt", "a")
output_file.close()

input_file = open("directory.txt", "r")
saved_lines = input_file.readlines()
input_file.close()
file_valid = True

for line in saved_lines:
    line = line.replace("\n", "")
    parts = line.split(" | Role: ")
    if len(parts) == 2:
        if parts[0][0:6] == "Name: " and parts[0][6:] != "" and parts[1] != "":
            member_list.append(parts[0][6:])
            member_roles.append(parts[1])
        else:
            file_valid = False
    elif line != "":
        file_valid = False

if file_valid == False:
    print("The saved file has an unknown format. No records were changed.")
    print("Check directory.txt before running the program again.")

choice = ""
while choice != "7":
    print("\n=====================================")
    print("     STUDENT CLUB MEMBER DIRECTORY")
    print("=====================================")
    print("1.) Add a member")
    print("2.) View member directory")
    print("3.) View officers")
    print("4.) View saved records")
    print("5.) Delete a member")
    print("6.) Update a member's role")
    print("7.) Exit")
    choice = input("Select an option: ")

    if choice == "1":
        new_member_name = input("Member name: ")
        new_member_role = choose_role()
        member_list.append(new_member_name)
        member_roles.append(new_member_role)
        save_directory(member_list, member_roles)
        print("Member added and saved!")

    elif choice == "2":
        show_directory(member_list, member_roles)

    elif choice == "3":
        print("\n============= OFFICERS ==============")
        officer_count = 0
        for i in range(len(member_list)):
            role = member_roles[i]
            if role == "President" or role == "Vice President" or role == "Secretary" or role == "Treasurer":
                officer_count = officer_count + 1
                print(format_member(member_list[i], member_roles[i]))
        if officer_count == 0:
            print("No officers found.")
        else:
            print("Total officers: " + str(officer_count))

    elif choice == "4":
        input_file = open("directory.txt", "r")
        saved_directory = input_file.read()
        input_file.close()
        print("\n=========== SAVED RECORDS ===========")
        if saved_directory == "":
            print("The saved directory is empty.")
        else:
            print(saved_directory)

    elif choice == "5":
        if len(member_list) == 0:
            print("There are no members to delete.")
        else:
            position = choose_member(member_list, member_roles)
            if position != -1:
                del member_list[position]
                del member_roles[position]
                save_directory(member_list, member_roles)
                print("Member deleted and file updated!")
            else:
                print("Delete canceled.")

    elif choice == "6":
        if len(member_list) == 0:
            print("There are no members to update.")
        else:
            position = choose_member(member_list, member_roles)
            if position != -1:
                member_roles[position] = choose_role()
                save_directory(member_list, member_roles)
                print("Role updated and saved!")
            else:
                print("Update canceled.")

    elif choice == "7":
        print("Goodbye! Your records are saved in directory.txt.")
    else:
        print("Invalid option. Please select a number from 1 to 7.")

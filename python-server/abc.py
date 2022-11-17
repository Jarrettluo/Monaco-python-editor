import os

if __name__ == "__main__":
    path = './usercode/'

    #新增文件
    # if os.path.exists('./usercode/' + 'zjl.py'):
    #     print("ws")
    # else:
    #     open(path+'zjl.py', 'w+')

    #删除文件
    # os.remove('./usercode/zjl.py')

    for file_name in os.listdir(path):
        print(file_name)
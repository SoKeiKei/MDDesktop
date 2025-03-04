#!/usr/bin/env python3
import os
import sys
import subprocess
import shutil

def execute_git_command(command):
    """
    执行git命令的通用函数
    - 使用subprocess.run执行git命令
    - 处理命令输出和错误
    - 特殊处理首次推送分支的情况
    """
    try:
        # 添加环境变量设置来强制使用 UTF-8 编码
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        env['LANG'] = 'en_US.UTF-8'
        
        # 添加 encoding 参数并使用环境变量
        result = subprocess.run(['git'] + command, 
                             capture_output=True, 
                             text=True,
                             encoding='utf-8',
                             errors='replace',
                             env=env)
        
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            # 检查是否是首次推送的错误
            if "no upstream branch" in result.stderr:
                print("首次推送分支，正在设置上游分支...")
                current_branch = subprocess.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], 
                                             capture_output=True, 
                                             text=True,
                                             encoding='utf-8',
                                             errors='replace',
                                             env=env).stdout.strip()
                # 使用 --set-upstream 选项设置上游分支
                push_result = subprocess.run(['git', 'push', '--set-upstream', 'origin', current_branch],
                                          capture_output=True,
                                          text=True,
                                          encoding='utf-8',
                                          errors='replace',
                                          env=env)
                if push_result.stdout:
                    print(push_result.stdout)
                if push_result.stderr:
                    print(push_result.stderr)
            else:
                print(result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"执行出错: {str(e)}")
        return False

def show_menu():
    """
    显示分组后的主菜单选项
    """
    print("\n====== Git 命令行工具 ======")
    print("\n[基础操作]")
    print("1. git status - 查看仓库状态")
    print("2. git add    - 添加文件到暂存区")
    print("3. git commit - 提交更改")
    print("4. git log    - 查看提交历史")
    
    print("\n[远程仓库操作]")
    print("5. git push   - 推送到远程仓库")
    print("6. git pull   - 拉取远程更新")
    print("7. git clone  - 克隆远程仓库")
    print("8. git remote - 管理远程仓库")
    
    print("\n[分支管理]")
    print("9.  git branch   - 分支操作")
    print("10. git checkout - 切换分支")
    
    print("\n[配置管理]")
    print("11. git config - 配置Git信息")
    
    print("\n[其他]")
    print("0. 退出程序")
    print("\n=========================")

def handle_add():
    """
    处理git add命令
    提供添加所有文件或指定文件的选项
    """
    print("\n=== Git Add ===")
    print("1. 添加所有文件 (git add .)")
    print("2. 添加指定文件")
    choice = input("请选择 (1/2): ")
    
    if choice == "1":
        execute_git_command(['add', '.'])
    elif choice == "2":
        file_name = input("请输入要添加的文件名: ")
        execute_git_command(['add', file_name])

def handle_commit():
    """
    处理git commit命令
    """
    print("\n=== Git Commit ===")
    print("1. 正常提交")
    print("2. 跳过检查提交 (--no-verify)")
    choice = input("请选择 (1/2): ")
    
    commit_message = input("\n请输入提交信息: ")
    if choice == "1":
        execute_git_command(['commit', '-m', commit_message])
    elif choice == "2":
        execute_git_command(['commit', '-m', commit_message, '--no-verify'])
    else:
        print("无效的选择")

def handle_branch():
    """
    分支操作功能:
    - 查看所有分支
    - 创建新分支
    - 删除分支
    """
    print("\n=== 分支操作 ===")
    print("1. 查看所有分支")
    print("2. 创建新分支")
    print("3. 删除分支")
    choice = input("请选择 (1/2/3): ")
    
    if choice == "1":
        execute_git_command(['branch'])
    elif choice == "2":
        branch_name = input("请输入新分支名称: ")
        execute_git_command(['branch', branch_name])
    elif choice == "3":
        branch_name = input("请输入要删除的分支名称: ")
        execute_git_command(['branch', '-d', branch_name])

def handle_clone():
    """
    处理git clone命令
    支持克隆仓库到当前目录
    """
    repo_url = input("\n请输入GitHub仓库URL: ")
    try:
        # 首先确保目录为空或只包含.git文件夹
        current_dir = os.getcwd()
        files = os.listdir(current_dir)
        if files and any(f != '.git' for f in files):
            print("警告：当前目录不为空！")
            confirm = input("是否继续？这可能会覆盖现有文件 (y/n): ")
            if confirm.lower() != 'y':
                return

        # 创建临时目录
        temp_dir = os.path.join(current_dir, 'temp_clone')
        os.makedirs(temp_dir, exist_ok=True)
        
        # 先克隆到临时目录
        subprocess.run(['git', 'clone', repo_url, temp_dir], check=True)
        
        # 移动文件到当前目录
        temp_contents = os.listdir(temp_dir)
        for item in temp_contents:
            if item != '.git':  # 不移动.git文件夹
                src = os.path.join(temp_dir, item)
                dst = os.path.join(current_dir, item)
                if os.path.exists(dst):
                    if os.path.isdir(dst):
                        shutil.rmtree(dst)
                    else:
                        os.remove(dst)
                if os.path.isdir(src):
                    shutil.copytree(src, dst)
                else:
                    shutil.copy2(src, dst)
        
        # 清理临时目录
        shutil.rmtree(temp_dir)
        
        print("仓库克隆成功！")
        
    except Exception as e:
        print(f"克隆失败: {str(e)}")

def handle_config():
    """
    Git配置管理:
    - 查看当前配置
    - 设置用户名和邮箱
    """
    print("\n=== Git 配置 ===")
    print("1. 查看当前配置")
    print("2. 设置用户名和邮箱")
    choice = input("请选择 (1/2): ")
    
    if choice == "1":
        execute_git_command(['config', '--list'])
    elif choice == "2":
        username = input("请输入Git用户名: ")
        email = input("请输入Git邮箱: ")
        execute_git_command(['config', '--global', 'user.name', username])
        execute_git_command(['config', '--global', 'user.email', email])
        print("Git用户信息配置完成！")

def handle_remote():
    """
    远程仓库管理:
    - 查看远程仓库
    - 添加远程仓库
    - 修改远程仓库URL
    """
    print("\n=== 远程仓库管理 ===")
    print("1. 查看远程仓库")
    print("2. 添加远程仓库")
    print("3. 修改远程仓库URL")
    choice = input("请选择 (1/2/3): ")
    
    if choice == "1":
        execute_git_command(['remote', '-v'])
    elif choice == "2":
        remote_name = input("请输入远程仓库名称 (通常是origin): ")
        remote_url = input("请输入远程仓库URL: ")
        execute_git_command(['remote', 'add', remote_name, remote_url])
    elif choice == "3":
        remote_name = input("请输入远程仓库名称 (通常是origin): ")
        remote_url = input("请输入新的远程仓库URL: ")
        execute_git_command(['remote', 'set-url', remote_name, remote_url])

def handle_push():
    """
    处理git push命令
    - 检查是否有未提交的更改
    - 提供处理未提交更改的选项
    - 执行推送操作
    """
    try:
        # 检查是否有未提交的更改
        status_result = subprocess.run(['git', 'status', '--porcelain'], 
                                    capture_output=True, text=True)
        
        if status_result.stdout.strip():
            print("\n检测到未提交的更改！请选择处理方式：")
            print("1. 暂存并提交更改")
            print("2. 暂时储藏更改(stash)")
            print("3. 取消操作")
            
            choice = input("请选择 (1-3): ")
            
            if choice == "1":
                # 暂存并提交
                execute_git_command(['add', '.'])
                commit_msg = input("请输入提交信息: ")
                execute_git_command(['commit', '-m', commit_msg])
            elif choice == "2":
                # 储藏更改
                print("储藏当前更改...")
                execute_git_command(['stash'])
            elif choice == "3":
                print("操作已取消")
                return
            else:
                print("无效的选择")
                return

        # 获取当前分支名
        current_branch = subprocess.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], 
                                     capture_output=True, text=True).stdout.strip()
        print(f"正在推送分支 '{current_branch}' 到远程仓库...")
        
        # 直接尝试推送到远程，设置上游分支
        push_result = execute_git_command(['push', '--set-upstream', 'origin', current_branch])
        
        if push_result:
            print(f"成功推送分支 '{current_branch}' 到远程仓库")
            
            # 如果之前选择了储藏更改，现在恢复它们
            if choice == "2":
                print("恢复储藏的更改...")
                execute_git_command(['stash', 'pop'])
                print("如果有冲突，请手动解决后提交")
        else:
            print("推送失败，请检查以下可能的原因：")
            print("1. 远程仓库是否已配置")
            print("2. 是否有推送权限")
            print("3. 网络连接是否正常")
            print("\n可以使用以下命令检查远程仓库配置：")
            print("选择选项 8 (git remote) 然后选择 1 查看远程仓库配置")
            
    except Exception as e:
        print(f"推送失败: {str(e)}")

def handle_pull():
    """
    处理git pull命令
    """
    try:
        # 首先检查是否有未提交的更改
        status_result = subprocess.run(['git', 'status', '--porcelain'], 
                                    capture_output=True, text=True)
        
        if status_result.stdout.strip():
            print("\n检测到未提交的更改！请选择处理方式：")
            print("1. 暂存并提交更改")
            print("2. 暂时储藏更改(stash)")
            print("3. 放弃更改")
            print("4. 取消操作")
            
            choice = input("请选择 (1-4): ")
            
            if choice == "1":
                # 暂存并提交
                execute_git_command(['add', '.'])
                commit_msg = input("请输入提交信息: ")
                execute_git_command(['commit', '-m', commit_msg])
            elif choice == "2":
                # 储藏更改
                print("储藏当前更改...")
                execute_git_command(['stash'])
            elif choice == "3":
                # 放弃更改
                print("放弃所有本地更改...")
                execute_git_command(['reset', '--hard'])
            elif choice == "4":
                print("操作已取消")
                return
            else:
                print("无效的选择")
                return
        
        # 获取当前分支名
        current_branch = subprocess.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], 
                                     capture_output=True, text=True).stdout.strip()
        print(f"正在拉取分支 '{current_branch}' 的更新...")
        
        # 设置跟踪信息
        print("设置分支跟踪信息...")
        subprocess.run(['git', 'branch', '--set-upstream-to', f'origin/{current_branch}', current_branch], 
                      capture_output=True, text=True)
        
        # 设置 pull 策略
        print("配置 pull 策略...")
        subprocess.run(['git', 'config', 'pull.rebase', 'true'], 
                      capture_output=True, text=True)
        
        # 拉取更新
        execute_git_command(['pull'])
        
        # 如果之前选择了储藏更改，现在恢复它们
        if choice == "2":
            print("恢复储藏的更改...")
            execute_git_command(['stash', 'pop'])
            print("如果有冲突，请手动解决后提交")
            
    except Exception as e:
        print(f"拉取失败: {str(e)}")

def main():
    """
    主函数，运行Git工具的主循环
    """
    while True:
        show_menu()
        choice = input("\n请选择操作 (0-11): ")
        
        # 基础操作
        if choice == "1":
            execute_git_command(['status'])
        elif choice == "2":
            handle_add()
        elif choice == "3":
            handle_commit()
        elif choice == "4":
            execute_git_command(['log', '--oneline'])
        
        # 远程仓库操作
        elif choice == "5":
            handle_push()
        elif choice == "6":
            handle_pull()
        elif choice == "7":
            handle_clone()
        elif choice == "8":
            handle_remote()
        
        # 分支管理
        elif choice == "9":
            handle_branch()
        elif choice == "10":
            branch_name = input("请输入要切换的分支名称: ")
            execute_git_command(['checkout', branch_name])
        
        # 配置管理
        elif choice == "11":
            handle_config()
        
        # 退出
        elif choice == "0":
            print("\n感谢使用，再见！")
            sys.exit(0)
        else:
            print("\n无效的选择，请重试")

if __name__ == "__main__":
    main() 
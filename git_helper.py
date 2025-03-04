import os
import subprocess
from typing import Optional

class Colors:
    # 前景色
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    
    # 背景色
    BG_BLACK = '\033[40m'
    BG_RED = '\033[41m'
    BG_GREEN = '\033[42m'
    BG_YELLOW = '\033[43m'
    BG_BLUE = '\033[44m'
    
    # 样式
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    
    # 结束符
    END = '\033[0m'
    
    # 预定义的样式组合
    TITLE = BOLD + BLUE
    SUBTITLE = BOLD + CYAN
    SUCCESS = GREEN
    ERROR = RED
    WARNING = YELLOW
    INFO = CYAN
    PROMPT = BOLD + WHITE
    MENU_ITEM = WHITE
    
    # 菜单样式
    MENU_HEADER = BOLD + BLUE
    MENU_SECTION = BOLD + YELLOW
    MENU_BORDER = BOLD + BLUE

def colorize(text: str, color: str) -> str:
    """为文本添加颜色"""
    return f"{color}{text}{Colors.END}"

def print_menu_header(title: str):
    """打印菜单标题"""
    print(f"\n{colorize('='*20, Colors.MENU_BORDER)}")
    print(colorize(f" {title} ", Colors.MENU_HEADER))
    print(colorize('='*20, Colors.MENU_BORDER))

def print_section(name: str):
    """打印分区标题"""
    print(colorize(f"\n[{name}]", Colors.MENU_SECTION))

def print_menu_item(index: str, text: str):
    """打印菜单项"""
    print(colorize(f"{index}. {text}", Colors.MENU_ITEM))

def get_input(prompt: str, allow_empty: bool = True) -> str:
    """获取用户输入"""
    result = input(colorize(prompt, Colors.PROMPT)).strip()
    if not allow_empty and not result:
        return get_input(prompt, allow_empty)
    return result

def print_success(message: str):
    """打印成功消息"""
    print(colorize(f"\n✓ {message}", Colors.SUCCESS))

def print_error(message: str):
    """打印错误消息"""
    print(colorize(f"\n✗ {message}", Colors.ERROR))

def print_warning(message: str):
    """打印警告消息"""
    print(colorize(f"\n⚠ {message}", Colors.WARNING))

def print_info(message: str):
    """打印信息"""
    print(colorize(f"\n➤ {message}", Colors.INFO))

class GitHelper:
    def __init__(self):
        self.check_git_installed()

    def check_git_installed(self):
        """检查是否安装了Git"""
        try:
            subprocess.run(['git', '--version'], capture_output=True)
        except FileNotFoundError:
            print("错误：未安装Git！请先安装Git后再运行此程序。")
            exit(1)

    def run_command(self, command: list) -> tuple[bool, str]:
        """执行Git命令并返回结果"""
        try:
            result = subprocess.run(command, capture_output=True, text=True, encoding='utf-8')
            return True, result.stdout if result.returncode == 0 else result.stderr
        except Exception as e:
            return False, f"执行出错：{str(e)}"

    def init_repo(self) -> str:
        """初始化仓库"""
        success, output = self.run_command(['git', 'init'])
        return ("✓ 仓库初始化成功！\n.git文件夹已创建。" if success 
                else f"✗ 初始化失败：{output}")

    def config_user(self, name: str, email: str) -> str:
        """配置用户信息"""
        success1, output1 = self.run_command(['git', 'config', '--global', 'user.name', name])
        success2, output2 = self.run_command(['git', 'config', '--global', 'user.email', email])
        
        if success1 and success2:
            return f"用户信息设置成功！\n用户名：{name}\n邮箱：{email}"
        else:
            return f"设置失败：\n用户名设置：{output1}\n邮箱设置：{output2}"

    def check_status(self) -> str:
        """查看仓库状态"""
        success, output = self.run_command(['git', 'status'])
        return colorize(f"当前仓库状态：\n{output}", Colors.CYAN) if success else colorize(f"获取状态失败：{output}", Colors.RED)

    def add_files(self, file_path: Optional[str] = None) -> str:
        """添加文件到暂存区"""
        command = ['git', 'add', file_path if file_path else '.']
        success, output = self.run_command(command)
        if file_path:
            return f"文件 {file_path} 添加成功！" if success else f"添加失败：{output}"
        else:
            return "所有文件添加成功！" if success else f"添加失败：{output}"

    def commit_changes(self, message: str) -> str:
        """提交更改"""
        success, output = self.run_command(['git', 'commit', '-m', message])
        return f"提交成功！\n提交信息：{message}" if success else f"提交失败：{output}"

    def view_log(self) -> str:
        """查看提交历史"""
        success, output = self.run_command(['git', 'log', '--oneline'])
        return f"提交历史：\n{output}" if success else f"获取历史失败：{output}"

    def view_diff(self) -> str:
        """查看具体更改"""
        success, output = self.run_command(['git', 'diff'])
        if not output and success:
            return "没有未提交的更改。"
        return f"文件更改详情：\n{output}" if success else f"获取更改失败：{output}"

    def add_remote(self, name: str, url: str) -> str:
        """添加远程仓库"""
        success, output = self.run_command(['git', 'remote', 'add', name, url])
        return f"远程仓库 {name} 添加成功！" if success else f"添加失败：{output}"

    def remove_remote(self, name: str) -> str:
        """删除远程仓库"""
        success, output = self.run_command(['git', 'remote', 'remove', name])
        return f"远程仓库 {name} 删除成功！" if success else f"删除失败：{output}"

    def list_remotes(self) -> str:
        """列出所有远程仓库"""
        success, output = self.run_command(['git', 'remote', '-v'])
        return f"远程仓库列表：\n{output}" if success and output else "当前没有配置远程仓库。"

    def push_to_remote(self, remote: str, branch: str) -> str:
        """推送到远程仓库"""
        success, output = self.run_command(['git', 'push', remote, branch])
        return f"成功推送到远程仓库 {remote} 的 {branch} 分支！" if success else f"推送失败：{output}"

    def pull_from_remote(self, remote: str, branch: str) -> str:
        """从远程仓库拉取"""
        success, output = self.run_command(['git', 'pull', remote, branch])
        return f"成功从远程仓库 {remote} 的 {branch} 分支拉取更新！" if success else f"拉取失败：{output}"

    def view_staged(self) -> str:
        """查看暂存区文件"""
        success, output = self.run_command(['git', 'diff', '--cached'])
        if not output and success:
            return "暂存区没有文件。"
        return f"暂存区的文件更改：\n{output}" if success else f"获取暂存区失败：{output}"

    def unstage_files(self, file_path: Optional[str] = None) -> str:
        """从暂存区移除文件（不会丢失更改）"""
        command = ['git', 'reset', 'HEAD', file_path if file_path else '.']
        success, output = self.run_command(command)
        if file_path:
            return f"文件 {file_path} 已从暂存区移除！" if success else f"移除失败：{output}"
        else:
            return "所有文件已从暂存区移除！" if success else f"移除失败：{output}"

    def list_branches(self) -> str:
        """列出所有分支"""
        success, output = self.run_command(['git', 'branch'])
        return f"分支列表：\n{output}" if success else f"获取分支失败：{output}"

    def create_branch(self, branch_name: str) -> str:
        """创建新分支"""
        success, output = self.run_command(['git', 'branch', branch_name])
        return f"分支 {branch_name} 创建成功！" if success else f"创建失败：{output}"

    def switch_branch(self, branch_name: str) -> str:
        """切换分支"""
        success, output = self.run_command(['git', 'checkout', branch_name])
        return f"已切换到分支 {branch_name}" if success else f"切换失败：{output}"

    def reset_to_commit(self, commit_id: str, hard: bool = False) -> str:
        """回退到指定提交
        hard=True 会丢弃所有未提交的更改
        hard=False 会保留更改但取消暂存
        """
        command = ['git', 'reset', '--hard' if hard else '--mixed', commit_id]
        success, output = self.run_command(command)
        mode = "硬回退" if hard else "软回退"
        return f"{mode}到提交 {commit_id} 成功！" if success else f"回退失败：{output}"

    def view_detailed_log(self) -> str:
        """查看详细的提交历史"""
        success, output = self.run_command([
            'git', 'log', 
            '--pretty=format:%h - %an, %ar : %s',
            '--graph'
        ])
        return f"提交历史：\n{output}" if success else f"获取历史失败：{output}"

    def stash_changes(self, save_name: Optional[str] = None) -> str:
        """暂存工作区更改"""
        command = ['git', 'stash', 'save']
        if save_name:
            command.append(save_name)
        success, output = self.run_command(command)
        return "工作区更改已暂存！" if success else f"暂存失败：{output}"

    def list_stashes(self) -> str:
        """列出所有暂存的更改"""
        success, output = self.run_command(['git', 'stash', 'list'])
        return f"暂存列表：\n{output}" if not output else "没有暂存的更改"

    def apply_stash(self, stash_id: str = "stash@{0}") -> str:
        """应用暂存的更改"""
        success, output = self.run_command(['git', 'stash', 'apply', stash_id])
        return f"已应用暂存 {stash_id}" if success else f"应用失败：{output}"

    def add_and_commit_all(self, message: str) -> str:
        """直接添加并提交所有文件"""
        add_result = self.add_files()  # 添加所有文件
        if "成功" not in add_result:
            return f"添加文件失败：{add_result}"
        
        commit_result = self.commit_changes(message)
        return f"添加并提交成功！\n{commit_result}"

    def get_recent_commits(self, count: int = 5) -> str:
        """获取最近的几次提交记录"""
        success, output = self.run_command([
            'git', 'log', 
            f'-n{count}',
            '--pretty=format:%d. %h - %s (%ar)',
            '--abbrev-commit'
        ])
        # 添加序号并格式化输出
        if success:
            commits = output.split('\n')
            formatted_commits = []
            for i, commit in enumerate(commits, 1):
                # 移除可能存在的自动序号，添加新的序号
                commit_without_num = commit.lstrip('0123456789. ')
                formatted_commits.append(f"{i}. {commit_without_num}")
            return "最近 5 次提交：\n" + "\n".join(formatted_commits)
        return f"获取历史失败：{output}"

    def delete_commit(self, commit_id: str, mode: str = 'soft') -> str:
        """删除指定的提交
        mode: 
            'soft' - 保留更改但删除提交
            'hard' - 完全删除提交和更改
        """
        if mode not in ['soft', 'hard']:
            return "无效的删除模式，请使用 'soft' 或 'hard'"
        
        # 先获取当前分支名
        success, branch = self.run_command(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
        if not success:
            return f"获取分支信息失败：{branch}"
        
        # 检查是否是最新的提交
        success, latest = self.run_command(['git', 'rev-parse', 'HEAD'])
        is_latest = latest.strip() == commit_id
        
        if is_latest:
            # 如果是最新的提交，使用reset
            command = ['git', 'reset', f'--{mode}', 'HEAD~1']
        else:
            # 如果不是最新的提交，使用rebase
            command = ['git', 'rebase', '-i', f'{commit_id}~1']
            return "非最新提交的删除需要手动编辑rebase文件，请使用git命令行操作"
        
        success, output = self.run_command(command)
        if success:
            mode_text = "软" if mode == 'soft' else "硬"
            return f"{mode_text}删除提交 {commit_id} 成功！"
        else:
            return f"删除失败：{output}"

def show_submenu(title: str, options: list, helper: GitHelper) -> None:
    """显示子菜单"""
    while True:
        print_menu_header(title)
        for i, (text, _) in enumerate(options, 1):
            print_menu_item(str(i), text)
        print_menu_item("q", "返回上级菜单")
        
        choice = get_input("\n请选择操作: ").lower()
        if choice == 'q':
            break
            
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(options):
                _, func = options[idx]
                func()
            else:
                print_error("无效的选择！")
        except ValueError:
            print_error("请输入有效的数字！")
        
        input(colorize("\n按回车键继续...", Colors.PROMPT))

def main():
    helper = GitHelper()
    
    while True:
        print_menu_header("Git 本地管理助手")
        
        print_section("基础配置")
        print_menu_item("1", "初始化仓库")
        print_menu_item("2", "设置用户信息")
        
        print_section("文件操作")
        print_menu_item("3", "查看仓库状态")
        print_menu_item("4", "文件暂存和提交")
        print_menu_item("5", "查看提交历史")
        print_menu_item("6", "查看具体更改")
        
        print_section("版本控制")
        print_menu_item("7", "版本管理")
        
        print_section("远程操作")
        print_menu_item("8", "远程仓库管理")
        
        print_section("系统")
        print_menu_item("q", "退出程序")
        
        print(colorize("\n" + "="*20, Colors.MENU_BORDER))
        
        choice = get_input("\n请输入选择: ").lower()
        
        if choice == 'q':
            print_success("感谢使用！再见！")
            break
            
        elif choice == '1':
            print(helper.init_repo())
            
        elif choice == '2':
            name = get_input("请输入用户名: ", False)
            email = get_input("请输入邮箱: ", False)
            print(helper.config_user(name, email))
            
        elif choice == '3':
            print(helper.check_status())
            
        elif choice == '4':
            # 文件暂存和提交子菜单
            file_options = [
                ("添加所有文件到暂存区", lambda: print(helper.add_files())),
                ("添加指定文件到暂存区", lambda: print(helper.add_files(get_input("请输入文件路径: ", False)))),
                ("查看暂存区文件", lambda: print(helper.view_staged())),
                ("从暂存区移除文件", lambda: print(helper.unstage_files(get_input("请输入文件路径(直接回车移除所有): ")))),
                ("提交暂存的更改", lambda: print(helper.commit_changes(get_input("请输入提交说明: ", False)))),
                ("直接提交所有更改", lambda: print(helper.add_and_commit_all(get_input("请输入提交说明: ", False))))
            ]
            show_submenu("文件暂存和提交", file_options, helper)
            
        elif choice == '5':
            print(helper.view_detailed_log())
            
        elif choice == '6':
            print(helper.view_diff())
            
        elif choice == '7':
            # 版本管理子菜单
            version_options = [
                ("查看分支列表", lambda: print(helper.list_branches())),
                ("创建新分支", lambda: print(helper.create_branch(
                    get_input("请输入新分支名称: ", False)))),
                ("切换分支", lambda: print(helper.switch_branch(
                    get_input("请输入要切换的分支名称: ", False)))),
                ("查看详细提交历史", lambda: print(helper.view_detailed_log())),
                ("版本回退", lambda: handle_version_rollback(helper)),
                ("暂存工作区", lambda: print(helper.stash_changes(
                    get_input("请输入暂存说明(可选): ")))),
                ("查看暂存列表", lambda: print(helper.list_stashes())),
                ("恢复暂存的更改", lambda: print(helper.apply_stash(
                    get_input("请输入暂存ID(直接回车使用最近的暂存): ")))),
                ("删除指定提交", lambda: handle_commit_deletion(helper))
            ]
            show_submenu("版本管理", version_options, helper)
            
        elif choice == '8':
            # 远程仓库管理子菜单
            remote_options = [
                ("查看远程仓库", lambda: print(helper.list_remotes())),
                ("添加远程仓库", lambda: print(helper.add_remote(
                    get_input("请输入远程仓库名称(如 origin): ", False),
                    get_input("请输入远程仓库地址: ", False)))),
                ("删除远程仓库", lambda: print(helper.remove_remote(
                    get_input("请输入要删除的远程仓库名称: ", False)))),
                ("推送到远程", lambda: print(helper.push_to_remote(
                    get_input("请输入远程仓库名称: ", False),
                    get_input("请输入分支名称: ", False)))),
                ("从远程拉取", lambda: print(helper.pull_from_remote(
                    get_input("请输入远程仓库名称: ", False),
                    get_input("请输入分支名称: ", False))))
            ]
            show_submenu("远程仓库管理", remote_options, helper)
        
        else:
            print_error("无效的选择！")
        
        input(colorize("\n按回车键继续...", Colors.PROMPT))

def handle_version_rollback(helper: GitHelper):
    """处理版本回退"""
    while True:
        print_menu_header("版本回退")
        # 获取最近的提交记录
        success, commits = helper.run_command([
            'git', 'log', 
            '-n5',
            '--pretty=format:%h %s',
            '--abbrev-commit'
        ])
        
        if success:
            commits = commits.split('\n')
            print("\n选项：")
            for i, commit in enumerate(commits, 1):
                commit_id, *msg = commit.split(' ')
                print_menu_item(str(i), f"{commit_id} - {' '.join(msg)}")
            
            print_menu_item("6", "使用提交ID回退")
            print_menu_item("7", "回退至最新版本")
            print_menu_item("8", "返回上级菜单")
            
            choice = get_input("\n请选择: ")
            
            if choice.isdigit() and 1 <= int(choice) <= len(commits):
                commit_id = commits[int(choice)-1].split(' ')
                commit_msg = ' '.join(commit_id[1:])  # 获取提交信息
                commit_id = commit_id[0]  # 获取提交ID
                print_info(f"\n您选择回退到以下版本：")
                print(f"提交ID: {commit_id}")
                print(f"提交信息: {commit_msg}")
                confirm = get_input("\n确认要回退到该版本吗？(y/N): ").lower()
                if confirm == 'y':
                    hard = get_input("是否强制回退？这将丢弃所有未提交的更改(y/N): ").lower() == 'y'
                    print(helper.reset_to_commit(commit_id, hard))
                else:
                    print_info("已取消回退操作")
            elif choice == '6':
                commit_id = get_input("请输入要回退到的提交ID: ", False)
                # 获取该提交的详细信息
                success, commit_info = helper.run_command([
                    'git', 'show', '-s', '--format=%h - %s', commit_id
                ])
                if success:
                    print_info(f"\n您选择回退到以下版本：")
                    print(commit_info)
                    confirm = get_input("\n确认要回退到该版本吗？(y/N): ").lower()
                    if confirm == 'y':
                        hard = get_input("是否强制回退？这将丢弃所有未提交的更改(y/N): ").lower() == 'y'
                        print(helper.reset_to_commit(commit_id, hard))
                    else:
                        print_info("已取消回退操作")
                else:
                    print_error("无效的提交ID")
            elif choice == '7':
                confirm = get_input("确认要回退至最新版本吗？(y/N): ").lower()
                if confirm == 'y':
                    success, latest_commit = helper.run_command(['git', 'rev-parse', 'HEAD'])
                    if success:
                        print(helper.reset_to_commit(latest_commit.strip()))
                        print_success("已回退至最新版本")
                    else:
                        print_error("获取最新提交失败")
                else:
                    print_info("已取消回退操作")
            elif choice == '8':
                break
            else:
                print_error("无效的选择！")
        else:
            print_error("获取提交历史失败")

def handle_commit_deletion(helper: GitHelper):
    """处理提交删除"""
    while True:
        print_menu_header("删除提交")
        print(helper.get_recent_commits())
        print_warning("删除提交是危险操作，请谨慎使用！")
        print_menu_item("1", "软删除（保留更改）")
        print_menu_item("2", "硬删除（完全删除）")
        print_menu_item("3", "返回上级菜单")
        
        choice = get_input("\n请选择: ")
        if choice in ['1', '2']:
            commit_id = get_input("请输入要删除的提交ID: ", False)
            mode = 'soft' if choice == '1' else 'hard'
            print(helper.delete_commit(commit_id, mode))
        elif choice == '3':
            break
        else:
            print_error("无效的选择！")

if __name__ == "__main__":
    # 在 Windows 中启用 ANSI 支持
    if os.name == 'nt':
        os.system('color')
    main() 
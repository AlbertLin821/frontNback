using Dapper;
using Microsoft.Data.SqlClient;

namespace BookSystem.Model
{
    /// <summary>
    /// 書籍服務類別，負責處理書籍相關的資料庫操作
    /// </summary>
    public class BookService
    {
        /// <summary>
        /// 書籍狀態常數
        /// </summary>
        private const string BOOK_STATUS_AVAILABLE = "A";        // 可以借出
        private const string BOOK_STATUS_UNAVAILABLE = "U";      // 不可借出
        private const string BOOK_STATUS_BORROWED = "B";         // 已借出
        private const string BOOK_STATUS_BORROWED_UNCLAIMED = "C"; // 已借出(未領)
        
        /// <summary>
        /// 程式碼類型常數
        /// </summary>
        private const string CODE_TYPE_BOOK_STATUS = "BOOK_STATUS";
        
        /// <summary>
        /// 預設使用者名稱
        /// </summary>
        private const string DEFAULT_USER = "Admin";
        
        /// <summary>
        /// 空白書名預設值
        /// </summary>
        private const string DEFAULT_BLANK_BOOK_NAME = "The-Name-Is-Blank";

        /// <summary>
        /// 取得預設連線字串
        /// </summary>
        /// <returns>資料庫連線字串</returns>
        private string GetDBConnectionString()
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .Build();

            return config.GetConnectionString("DBConn") ?? string.Empty;
        }

        /// <summary>
        /// 取得書名處理的 SQL CASE 語句片段
        /// 當書名為空或空白時，回傳預設值
        /// </summary>
        /// <param name="tableAlias">資料表別名</param>
        /// <returns>SQL CASE 語句字串</returns>
        private string GetBookNameCaseStatement(string tableAlias = "A")
        {
            return $@"CASE 
                            WHEN {tableAlias}.BOOK_NAME IS NULL OR LTRIM(RTRIM({tableAlias}.BOOK_NAME)) = '' 
                            THEN '{DEFAULT_BLANK_BOOK_NAME}' 
                            ELSE {tableAlias}.BOOK_NAME 
                        END";
        }

        /// <summary>
        /// 查詢書籍列表
        /// </summary>
        /// <param name="arg">查詢條件參數</param>
        /// <returns>符合條件的書籍列表</returns>
        public List<Book> QueryBook(BookQueryArg arg)
        {
            var result = new List<Book>();
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                string sql = $@"
                    Select 
                        A.BOOK_ID As BookId,
                        {GetBookNameCaseStatement("A")} As BookName,
                        A.BOOK_CLASS_ID As BookClassId,
                        B.BOOK_CLASS_NAME As BookClassName,
                        Convert(VarChar(10),A.BOOK_BOUGHT_DATE,120) As BookBoughtDate,
                        A.BOOK_STATUS As BookStatusId,
                        C.CODE_NAME As BookStatusName,
                        A.BOOK_KEEPER As BookKeeperId,
                        D.USER_CNAME As BookKeeperCname,
                        D.USER_ENAME As BookKeeperEname
                    From BOOK_DATA As A
                        Inner Join BOOK_CLASS As B On A.BOOK_CLASS_ID=B.BOOK_CLASS_ID
                        Inner Join BOOK_CODE As C On A.BOOK_STATUS=C.CODE_ID And C.CODE_TYPE='{CODE_TYPE_BOOK_STATUS}'
                        Left Join MEMBER_M As D On A.BOOK_KEEPER=D.USER_ID
                    Where (A.BOOK_ID=@BOOK_ID Or @BOOK_ID=0)
                        And (A.BOOK_NAME Like @BOOK_NAME Or @BOOK_NAME='')
                        And (A.BOOK_CLASS_ID=@BOOK_CLASS_ID Or @BOOK_CLASS_ID='')
                        And (A.BOOK_KEEPER=@BOOK_KEEPER_ID Or @BOOK_KEEPER_ID='')
                        And (A.BOOK_STATUS=@BOOK_STATUS_ID Or @BOOK_STATUS_ID='')";
                
                Dictionary<string, Object> parameter = new Dictionary<string, object>();
                parameter.Add("@BOOK_ID", arg.BookId);
                parameter.Add("@BOOK_NAME", arg.BookName != null ? "%" + arg.BookName + "%" : string.Empty);
                parameter.Add("@BOOK_CLASS_ID", arg.BookClassId ?? string.Empty);
                parameter.Add("@BOOK_KEEPER_ID", arg.BookKeeperId ?? string.Empty);
                parameter.Add("@BOOK_STATUS_ID", arg.BookStatusId ?? string.Empty);
                
                result = conn.Query<Book>(sql, parameter).ToList();
            }
            return result;
        }

        /// <summary>
        /// 根據書籍編號取得書籍詳細資料
        /// </summary>
        /// <param name="bookId">書籍編號</param>
        /// <returns>書籍物件，若不存在則回傳 null</returns>
        public Book? GetBookById(int bookId)
        {
            Book? result = null;
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                string sql = $@"
                    Select 
                        A.BOOK_ID As BookId,
                        {GetBookNameCaseStatement("A")} As BookName,
                        A.BOOK_CLASS_ID As BookClassId,
                        B.BOOK_CLASS_NAME As BookClassName,
                        Convert(VarChar(10),A.BOOK_BOUGHT_DATE,120) As BookBoughtDate,
                        A.BOOK_STATUS As BookStatusId,
                        C.CODE_NAME As BookStatusName,
                        A.BOOK_KEEPER As BookKeeperId,
                        D.USER_CNAME As BookKeeperCname,
                        D.USER_ENAME As BookKeeperEname,
                        A.BOOK_AUTHOR As BookAuthor,
                        A.BOOK_PUBLISHER As BookPublisher,
                        A.BOOK_NOTE As BookNote
                    From BOOK_DATA As A
                        Inner Join BOOK_CLASS As B On A.BOOK_CLASS_ID=B.BOOK_CLASS_ID
                        Inner Join BOOK_CODE As C On A.BOOK_STATUS=C.CODE_ID And C.CODE_TYPE='{CODE_TYPE_BOOK_STATUS}'
                        Left Join MEMBER_M As D On A.BOOK_KEEPER=D.USER_ID
                    Where A.BOOK_ID=@BOOK_ID";
                
                Dictionary<string, Object> parameter = new Dictionary<string, object>();
                parameter.Add("@BOOK_ID", bookId);
                
                result = conn.Query<Book>(sql, parameter).FirstOrDefault();
            }
            return result;
        }

        /// <summary>
        /// 新增書籍
        /// </summary>
        /// <param name="book">書籍物件</param>
        public void AddBook(Book book)
        {
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                string sql = @"
                Insert Into BOOK_DATA
                (
	                BOOK_NAME,BOOK_CLASS_ID,
	                BOOK_AUTHOR,BOOK_BOUGHT_DATE,
	                BOOK_PUBLISHER,BOOK_NOTE,
	                BOOK_STATUS,BOOK_KEEPER,
	                BOOK_AMOUNT,
	                CREATE_DATE,CREATE_USER,MODIFY_DATE,MODIFY_USER
                )
                Select 
	                @BOOK_NAME,@BOOK_CLASS_ID,
	                @BOOK_AUTHOR,@BOOK_BOUGHT_DATE,
	                @BOOK_PUBLISHER,@BOOK_NOTE,
	                @BOOK_STATUS,@BOOK_KEEPER,
	                0 As BOOK_AMOUNT,
	                GetDate() As CREATE_DATE,@CREATE_USER As CREATE_USER,GetDate() As MODIFY_DATE,@MODIFY_USER As MODIFY_USER";

                Dictionary<string, Object> parameter = new Dictionary<string, object>();
                parameter.Add("@BOOK_NAME", book.BookName);
                parameter.Add("@BOOK_CLASS_ID", book.BookClassId);
                parameter.Add("@BOOK_AUTHOR", book.BookAuthor);
                parameter.Add("@BOOK_BOUGHT_DATE", book.BookBoughtDate);
                parameter.Add("@BOOK_PUBLISHER", book.BookPublisher);
                parameter.Add("@BOOK_NOTE", book.BookNote);
                parameter.Add("@BOOK_STATUS", BOOK_STATUS_AVAILABLE);
                parameter.Add("@BOOK_KEEPER", book.BookKeeperId);
                parameter.Add("@CREATE_USER", DEFAULT_USER);
                parameter.Add("@MODIFY_USER", DEFAULT_USER);

                conn.Execute(sql, parameter);
            }
        }

        /// <summary>
        /// 更新書籍資料
        /// 當書籍狀態為「已借出」或「已借出(未領)」時，會自動新增借閱紀錄
        /// </summary>
        /// <param name="book">書籍物件</param>
        public void UpdateBook(Book book)
        {
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                string sql = @"
                        Update BOOK_DATA Set
                            BOOK_NAME=@BOOK_NAME,
                            BOOK_CLASS_ID=@BOOK_CLASS_ID,
                            BOOK_AUTHOR=@BOOK_AUTHOR,
                            BOOK_BOUGHT_DATE=@BOOK_BOUGHT_DATE,
                            BOOK_PUBLISHER=@BOOK_PUBLISHER,
                            BOOK_NOTE=@BOOK_NOTE,
                            BOOK_STATUS=@BOOK_STATUS,
                            BOOK_KEEPER=@BOOK_KEEPER,
                            MODIFY_DATE=GetDate(),
                            MODIFY_USER=@MODIFY_USER
                        Where BOOK_ID=@BOOK_ID";

                Dictionary<string, Object> parameter = new Dictionary<string, object>();
                parameter.Add("@BOOK_NAME", book.BookName);
                parameter.Add("@BOOK_CLASS_ID", book.BookClassId);
                parameter.Add("@BOOK_AUTHOR", book.BookAuthor);
                parameter.Add("@BOOK_BOUGHT_DATE", book.BookBoughtDate);
                parameter.Add("@BOOK_PUBLISHER", book.BookPublisher);
                parameter.Add("@BOOK_NOTE", book.BookNote);
                parameter.Add("@BOOK_STATUS", book.BookStatusId);
                parameter.Add("@BOOK_KEEPER", book.BookKeeperId);
                parameter.Add("@BOOK_ID", book.BookId);
                parameter.Add("@MODIFY_USER", DEFAULT_USER);

                conn.Execute(sql, parameter);

                // 當書籍狀態為「已借出」或「已借出(未領)」時，新增借閱紀錄
                if (book.BookStatusId == BOOK_STATUS_BORROWED || book.BookStatusId == BOOK_STATUS_BORROWED_UNCLAIMED)
                {
                    sql = @"
                            Insert Into BOOK_LEND_RECORD
                            (
                                BOOK_ID,KEEPER_ID,LEND_DATE,
                                CRE_DATE,CRE_USR,MOD_DATE,MOD_USR
                            )
                            Values
                            (
                                @BOOK_ID,@KEEPER_ID,GetDate(),
                                GetDate(),@CREATE_USER,GetDate(),@MODIFY_USER
                            )";
                    parameter.Clear();
                    parameter.Add("@BOOK_ID", book.BookId);
                    parameter.Add("@KEEPER_ID", book.BookKeeperId);
                    parameter.Add("@CREATE_USER", DEFAULT_USER);
                    parameter.Add("@MODIFY_USER", DEFAULT_USER);

                    conn.Execute(sql, parameter);
                }
            }
        }

        /// <summary>
        /// 根據書籍編號刪除書籍
        /// </summary>
        /// <param name="bookId">書籍編號</param>
        public void DeleteBookById(int bookId)
        {
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                string sql = @"Delete From BOOK_DATA Where BOOK_ID=@BOOK_ID";

                Dictionary<string, Object> parameter = new Dictionary<string, object>();
                parameter.Add("@BOOK_ID", bookId);

                conn.Execute(sql, parameter);
            }
        }

        /// <summary>
        /// 取得書籍的借閱紀錄列表
        /// </summary>
        /// <param name="bookId">書籍編號</param>
        /// <returns>借閱紀錄列表，依借閱日期降序排列</returns>
        public List<BookLendRecord> GetBookLendRecord(int bookId)
        {
            var result = new List<BookLendRecord>();
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                string sql = $@"
                    Select 
                        A.BOOK_ID As BookId,
                        {GetBookNameCaseStatement("B")} As BookName,
                        A.KEEPER_ID As BookKeeperId,
                        C.USER_CNAME As BookKeeperCname,
                        C.USER_ENAME As BookKeeperEname,
                        Convert(VarChar(10),A.LEND_DATE,120) As LendDate
                    From BOOK_LEND_RECORD As A
                        Inner Join BOOK_DATA As B On A.BOOK_ID=B.BOOK_ID
                        Left Join MEMBER_M As C On A.KEEPER_ID=C.USER_ID
                    Where A.BOOK_ID=@BOOK_ID
                    Order By A.LEND_DATE Desc";
                
                Dictionary<string, Object> parameter = new Dictionary<string, object>();
                parameter.Add("@BOOK_ID", bookId);
                
                result = conn.Query<BookLendRecord>(sql, parameter).ToList();
            }
            return result;
        }
    }
}

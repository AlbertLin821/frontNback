using Dapper;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Data.SqlClient;
using System.ComponentModel;

namespace BookSystem.Model
{
    public class BookService
    {
        /// <summary>
        /// 取得預設連線字串
        /// </summary>
        /// <returns></returns>
        private string GetDBConnectionString()
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .Build();

            return config.GetConnectionString("DBConn");
        }

        public List<Book> QueryBook(BookQueryArg arg)
        {
            var result = new List<Book>();
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                //TODO:sql 補齊
                string sql = @"
                    Select 
	                    A.BOOK_ID As BookId,A.BOOK_NAME As BookName,
	                    A.BOOK_CLASS_ID As BookClassId,B.BOOK_CLASS_NAME As BookClassName,
	                    Convert(VarChar(10),A.BOOK_BOUGHT_DATE,120) As BookBoughtDate
                    From BOOK_DATA As A
	                    Inner Join BOOK_CLASS As B On A.BOOK_CLASS_ID=B.BOOK_CLASS_ID
	                    Inner Join BOOK_CODE As C On A.BOOK_STATUS=C.CODE_ID
	                    Where (A.BOOK_ID=@BOOK_ID Or @BOOK_ID=0)";
                Dictionary<string, Object> parameter = new Dictionary<string, object>();
                parameter.Add("@BOOK_ID", arg.BookId);
                parameter.Add("@BOOK_NAME", arg.BookName != null ? "%" + arg.BookName + "%" : string.Empty);
                result = conn.Query<Book>(sql, parameter).ToList();
            }
            return result;
        }

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
	                GetDate() As CREATE_DATE,'Admin' As CREATE_USER,GetDate() As MODIFY_DATE,'Admin' As MODIFY_USER";

                Dictionary<string, Object> parameter = new Dictionary<string, object>();
                parameter.Add("@BOOK_NAME", book.BookName);
                parameter.Add("@BOOK_CLASS_ID", book.BookClassId);
                parameter.Add("@BOOK_AUTHOR", book.BookAuthor);
                parameter.Add("@BOOK_BOUGHT_DATE", book.BookBoughtDate);
                parameter.Add("@BOOK_PUBLISHER", book.BookPublisher);
                parameter.Add("@BOOK_NOTE", book.BookNote);
                parameter.Add("@BOOK_STATUS", "A");
                parameter.Add("@BOOK_KEEPER", book.BookKeeperId);

                conn.Execute(sql, parameter);
            }
        }

        public void UpdateBook(Book book)
        {
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                try
                {
                    //TODO:Update SQL
                    string sql = @"";

                    Dictionary<string, Object> parameter = new Dictionary<string, object>();
                    parameter.Add("@BOOK_NAME", book.BookName);
                    parameter.Add("@BOOK_CLASS_ID", book.BookClassId);
                    parameter.Add("@BOOK_AUTHOR", book.BookAuthor);
                    parameter.Add("@BOOK_BOUGHT_DATE", book.BookBoughtDate);
                    parameter.Add("@BOOK_PUBLISHER", book.BookPublisher);
                    parameter.Add("@BOOK_NOTE", book.BookNote);
                    parameter.Add("@BOOK_STATUS", book.BookStatusId);
                    parameter.Add("@BOOK_KEEPER", book.BookKeeperId);
                    parameter.Add("BOOK_ID", book.BookId);

                    conn.Execute(sql, parameter);

                    if (book.BookStatusId == "B" || book.BookStatusId == "C")
                    {
                        sql = @"
                                Insert Into BOOK_LEND_RECORD
                                (
                                    BOOK_ID,KEEPER_ID,LEND_DATE,
                                    CRE_DATE,CRE_USR,MOD_DATE,MOD_USR
                                )
                                ";
                        parameter.Clear();
                        parameter.Add("@BOOK_ID", book.BookId);

                        conn.Execute(sql, parameter);
                    }
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }

        public void DeleteBookById(int bookId)
        {
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                string sql = @"Delete From BOOK_DATA Where BOOK_ID=@BOOK_ID";

                Dictionary<string, Object> parameter = new Dictionary<string, object>();
                parameter.Add("BOOK_ID", bookId);

                conn.Execute(sql, parameter);
            }
        }
    }
}

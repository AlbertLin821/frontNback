using BookSystem.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;
using System.Collections.Generic;

namespace BookSystem.Controllers
{
    /// <summary>
    /// 書籍維護控制器，提供書籍的新增、查詢、修改、刪除等功能
    /// </summary>
    [Route("api/bookmaintain")]
    [ApiController]
    public class BookMaintainController : ControllerBase
    {
        /// <summary>
        /// 書籍狀態常數
        /// </summary>
        private const string BOOK_STATUS_AVAILABLE = "A";        // 可以借出
        private const string BOOK_STATUS_UNAVAILABLE = "U";      // 不可借出
        private const string BOOK_STATUS_BORROWED = "B";         // 已借出
        private const string BOOK_STATUS_BORROWED_UNCLAIMED = "C"; // 已借出(未領)

        /// <summary>
        /// 統一錯誤處理方法
        /// </summary>
        /// <param name="ex">例外物件</param>
        /// <param name="operation">操作名稱</param>
        /// <returns>錯誤回應</returns>
        private IActionResult HandleError(Exception ex, string operation)
        {
            var errorMessage = $"{operation}失敗：{ex.Message}";
            if (ex.InnerException != null)
            {
                errorMessage += $" | 內部錯誤: {ex.InnerException.Message}";
            }
            
            return BadRequest(new ApiResult<string>()
            {
                Data = string.Empty,
                Status = false,
                Message = errorMessage
            });
        }
        /// <summary>
        /// 新增書籍
        /// </summary>
        /// <param name="book">書籍物件</param>
        /// <returns>操作結果</returns>
        [HttpPost]
        [Route("addbook")]
        public IActionResult AddBook(Book book)
        {
            try
            {
                // 新增書籍時，BookStatusId 和 BookKeeperId 不需要驗證（新增時使用預設值）
                ModelState.Remove("BookStatusId");
                ModelState.Remove("BookKeeperId");
                
                if (ModelState.IsValid)
                {
                    // 確保新增時使用預設狀態
                    if (string.IsNullOrEmpty(book.BookStatusId))
                    {
                        book.BookStatusId = BOOK_STATUS_AVAILABLE;
                    }
                    
                    BookService bookService = new BookService();
                    bookService.AddBook(book);
                    return Ok(
                        new ApiResult<string>()
                        {
                            Data = string.Empty,
                            Status = true,
                            Message = string.Empty
                        });
                }
                else
                {
                    var errors = new List<string>();
                    foreach (var modelError in ModelState)
                    {
                        foreach (var error in modelError.Value.Errors)
                        {
                            errors.Add($"{modelError.Key}: {error.ErrorMessage}");
                        }
                    }
                    return BadRequest(new ApiResult<string>()
                    {
                        Data = string.Empty,
                        Status = false,
                        Message = string.Join("; ", errors)
                    });
                }
            }
            catch (Exception ex)
            {
                return HandleError(ex, "新增書籍");
            }
        }
        /// <summary>
        /// 查詢書籍列表
        /// </summary>
        /// <param name="arg">查詢條件參數</param>
        /// <returns>符合條件的書籍列表</returns>
        [HttpPost()]
        [Route("querybook")]
        public IActionResult QueryBook([FromForm]BookQueryArg arg)
        {
            try
            {
                BookService bookService = new BookService();
                return Ok(bookService.QueryBook(arg));
            }
            catch (Exception ex)
            {
                return HandleError(ex, "查詢書籍");
            }
        }

        /// <summary>
        /// 根據書籍編號取得書籍詳細資料
        /// </summary>
        /// <param name="bookId">書籍編號</param>
        /// <returns>書籍詳細資料</returns>
        [HttpPost()]
        [Route("loadbook")]
        public IActionResult GetBookById([FromBody]int bookId)
        {
            try
            {
                BookService bookService = new BookService();
                Book? book = bookService.GetBookById(bookId);
                ApiResult<Book> result = new ApiResult<Book>
                {
                    Data = book,
                    Status = true,
                    Message = string.Empty
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return HandleError(ex, "載入書籍");
            }
        }
        /// <summary>
        /// 更新書籍資料
        /// </summary>
        /// <param name="book">書籍物件</param>
        /// <returns>操作結果</returns>
        [HttpPost]
        [Route("updatebook")]
        public IActionResult UpdateBook(Book book)
        {
            try
            {
                // 當借閱狀態為「可以借出」或「不可借出」時，借閱人可以為空
                if (book.BookStatusId == BOOK_STATUS_AVAILABLE || book.BookStatusId == BOOK_STATUS_UNAVAILABLE)
                {
                    ModelState.Remove("BookKeeperId");
                }
                
                if (ModelState.IsValid)
                {
                    BookService bookService = new BookService();
                    bookService.UpdateBook(book);
                    return Ok(
                        new ApiResult<string>()
                        {
                            Data = string.Empty,
                            Status = true,
                            Message = string.Empty
                        });
                }
                else
                {
                    var errors = new List<string>();
                    foreach (var modelError in ModelState)
                    {
                        foreach (var error in modelError.Value.Errors)
                        {
                            errors.Add($"{modelError.Key}: {error.ErrorMessage}");
                        }
                    }
                    return BadRequest(new ApiResult<string>()
                    {
                        Data = string.Empty,
                        Status = false,
                        Message = string.Join("; ", errors)
                    });
                }
            }
            catch (Exception ex)
            {
                return HandleError(ex, "更新書籍");
            }
        }

        /// <summary>
        /// 刪除書籍
        /// 若書籍狀態為「已借出」或「已借出(未領)」，則不允許刪除
        /// </summary>
        /// <param name="bookId">書籍編號</param>
        /// <returns>操作結果</returns>
        [HttpPost()]
        [Route("deletebook")]
        public IActionResult DeleteBookById([FromBody] int bookId)
        {
            try
            {
                BookService bookService = new BookService();

                ApiResult<string> result = new ApiResult<string>
                {
                    Data = string.Empty,
                    Status = true,
                    Message = string.Empty
                };

                Book? book = bookService.GetBookById(bookId);
                if (book != null && (book.BookStatusId == BOOK_STATUS_BORROWED || book.BookStatusId == BOOK_STATUS_BORROWED_UNCLAIMED))
                {
                    result.Status = false;
                    result.Message = "該書已借出不可刪除";
                }
                else
                {
                    bookService.DeleteBookById(bookId);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return HandleError(ex, "刪除書籍");
            }
        }
        /// <summary>
        /// 取得書籍的借閱紀錄列表
        /// </summary>
        /// <param name="bookId">書籍編號</param>
        /// <returns>借閱紀錄列表</returns>
        [HttpPost]
        [Route("booklendrecord")]
        public IActionResult GetBookLendRecord([FromBody] int bookId)
        {
            try
            {
                BookService bookService = new BookService();
                ApiResult<List<BookLendRecord>> result = new ApiResult<List<BookLendRecord>>
                {
                    Data = bookService.GetBookLendRecord(bookId),
                    Status = true,
                    Message = string.Empty
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return HandleError(ex, "取得借閱紀錄");
            }
        }
    }
}
